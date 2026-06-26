const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require('dotenv').config();
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const User = require('./models/userModel');

// Start express on port 3000
const app = express();
const port = 3000;

// Connect with Database
// Use IPv4 home addr since Node 17+ prefers IPv6 when 'localhost' is used makes mongod connection fail
mongoose.connect("mongodb://127.0.0.1:27017/GameJamDB");

// Set Environment
if(process.env.TARGET == "PROD")
{
    // Redirigir la salida estándar y la salida del error
    var access = fs.createWriteStream(path.join(__dirname, 'platform.log'));
    process.stdout.write = process.stderr.write = access.write.bind(access);
    process.on('uncaughtException', function(err){
        console.error((err & err.stack) ? err.stack : err);
    });
}

var root = "";
if(process.env.TARGET == "DEV")
{
    console.log("Target is DEV");
    // Configuración de CORS - Permite solicitudes desde un origen específico
    const corsOptions = {
        origin: function(origin, callback) {
            if (!origin) return callback(null, true);

            const allowedOrigins = ['http://localhost:3000/', 'http://localhost:4200','http://149.130.176.112'];
            if (allowedOrigins.indexOf(origin) !== -1) {
                // El origen está en la lista de orígenes permitidos
                callback(null, true);
            } else {
                // El origen no está en la lista de orígenes permitidos
                callback(new Error('Not allowed by CORS'));
            }
        },
        optionsSuccessStatus: 204, // Devolver un código de éxito 204
        methods: "GET, POST, PUT, DELETE", // Permitir estos métodos HTTP
        credentials: true, // Permite enviar cookies de forma segura
    };

    app.use(cors(corsOptions)); // Usar el middleware CORS

    root = "http://localhost:4200";
}

// Middleware para analizar solicitudes JSON y cookies
app.use(express.json());
app.use(cookieParser());

// Definir las rutas de la API para diferentes recursos

// Rutas de usuarios
const user_route = require('./routes/userRoute');
app.use('/api/user', user_route);

// Rutas de chat
const chat_route = require('./routes/chatRoute')
app.use('/api/chat', chat_route);

// Rutas de regiones
const region_route = require('./routes/regionRoute');
app.use('/api/region', region_route);

// Rutas de premios
const prize_route = require('./routes/prizeRoute');
app.use('/api/prize', prize_route);

// Rutas de sites
const site_route = require('./routes/siteRoute');
app.use('/api/site', site_route);

// Rutas de categorías
const category_route = require('./routes/categoryRoute');
app.use('/api/category', category_route);

// Rutas de GameJams
const game_jam_route = require('./routes/gameJamRoute');
app.use('/api/game-jam', game_jam_route);

// Rutas de Jams
const jam_route = require('./routes/jamRoute');
app.use('/api/jam', jam_route);

// Rutas de fases
const stage_route = require('./routes/stageRoute');
app.use('/api/stage', stage_route);

// Rutas de equipos
const team_route = require('./routes/teamRoute');
app.use('/api/team', team_route);

// Rutas de entregables
const submission_route = require('./routes/submissionRoute');
app.use('/api/submission', submission_route);

// Rutas de temas
const theme_route = require('./routes/themeRoute');
app.use('/api/theme', theme_route);

// Rutas de notificaciones
const notification_route = require('./routes/notificationRoute');
app.use('/api/notification', notification_route);

// Rutas de evaluaciones (judge evaluation module)
const evaluation_route = require('./routes/evaluationRoute');
app.use('/api/evaluations', evaluation_route);

app.get('/install', function (req, res){
    User.countDocuments({})
    .then(function(count) {
        let response = "Checking the installation...<br>\n";
        if(count <= 0)
        {
            if(process.env.ADMIN_EMAIL)
            {
                response = response + "Installing the system...<br>\n";
                user = new User({
                    email: process.env.ADMIN_EMAIL,
                    name: "GameJam+ Administrator",
                    roles: ["GlobalOrganizer"],
                    creationDate: new Date(),
                    lastUpdateDate: new Date()
                });
                user.save()
                .then(function(){
                    response = response + "The system installed successfully<br>";
                    response = response + 'Go to <a href:"/index.html">GameJamPlus Platform</a> and login with the administrator email to access the system'
                    res.send(response);
                });
            }
            else
            {
                response = response + "Set the admin email in the environment and run the install process again.";
                res.send(response);
            }
        }
        else 
        {
            response = response + "System is already installed<br>";
            response = response + 'Go to <a href="/index.html">GameJamPlus Platform</a> and login with the administrator email to access the system'
            res.send(response);
        }
    })
    .catch(function(error) {

    })
});

if(process.env.TARGET == "PROD")
{
    // Definir el archivo raíz para servir los archivos
    root = path.join(__dirname, 'dist/gj-platform/browser');

    // Servir los archivos estáticos
    app.use(express.static(root)); 

    // Manejar todas las rutas
    app.get('*', function (req, res) {
        fs.stat(path.join(root, req.path), function (err) {
            if (err) {
                res.sendFile('index.html', { root });
            } else {
                res.sendFile(req.path, { root });
            }
        });
    });
}


// Iniciar el servidor y escuchar en el puerto especificado
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

const Stage = require('./models/stageModel');
const GameJam = require('./models/gameJamEventModel');
const Submission = require('./models/submissionModel');
const Team = require('./models/teamModel');
const Evaluation = require('./models/evaluationModel');
const { expireStaleEvaluations } = require('./controllers/evaluationController');
const { sendScore } = require('./services/mailer');

const { JamStage, EvaluationStatus } = Evaluation;

// Best-effort map from a GameJam embedded stage's name to the JamStage enum the
// Evaluation collection is keyed by. The two stage representations are not
// formally linked (GameJam stages are free-text named; Evaluation.stage is an
// enum) — this keyword match bridges them. Confirm against real stage names.
function stageNameToJamStage(name) {
    const n = (name || '').toUpperCase();
    if (n.includes('INCUBA')) return JamStage.INCUBATION;
    if (n.includes('ACCELER') || n.includes('ACELER')) return JamStage.ACCELERATION;
    if (n.includes('GLOBAL') || n.includes('FINAL')) return JamStage.GLOBAL_FINAL;
    return null;
}

// Daily job: for any stage whose evaluation window ENDS today, average each
// submission's COMPLETED evaluations (from the Evaluation collection — NOT the
// legacy submission.evaluators array) into submission.evaluationScore and email
// each team their score.
async function sendEvaluations() {
    const currentDate = new Date().toISOString().slice(0, 10);

    const allGameJams = await GameJam.find({});
    const endingStages = [];
    for (const gameJam of allGameJams) {
        for (const stage of gameJam.stages) {
            if (currentDate === stage.endDateEvaluation.toISOString().slice(0, 10)) {
                const jamStage = stageNameToJamStage(stage.name);
                if (jamStage) endingStages.push(jamStage);
            }
        }
    }
    if (endingStages.length === 0) return;

    for (const jamStage of [...new Set(endingStages)]) {
        // Group completed evaluations by submission for this stage.
        const completed = await Evaluation.find({
            stage: jamStage,
            status: EvaluationStatus.COMPLETED
        });

        const bySubmission = new Map();
        for (const ev of completed) {
            const key = ev.submission.toString();
            if (!bySubmission.has(key)) bySubmission.set(key, []);
            bySubmission.get(key).push(ev);
        }

        for (const [submissionId, evals] of bySubmission) {
            // Grand mean of every non-N/A numeric category across all evaluators.
            let sum = 0;
            let count = 0;
            for (const ev of evals) {
                for (const cat of Evaluation.SCORE_CATEGORIES) {
                    const s = ev.scores && ev.scores[cat];
                    if (s && !s.na && typeof s.value === 'number') {
                        sum += s.value;
                        count += 1;
                    }
                }
            }
            if (count === 0) continue;
            const score = sum / count;

            const sub = await Submission.findById(submissionId);
            if (!sub) continue;
            sub.evaluationScore = score;
            await sub.save();

            const team = await Team.findById(sub.teamId);
            if (!team) continue;
            const promises = [];
            for (const jammer of team.jammers) {
                promises.push(sendScore(jammer.email, 'Score Stage on GameJam Platform', score));
            }
            await Promise.all(promises);
        }
    }
};

async function checkInstall() {
    let count = await User.countDocuments({});
    console.log(`${count} Users found`);
}

// Daily scoring + emails.
cron.schedule('0 0 * * *', () => {
    sendEvaluations();
}, {
    timezone: "America/Costa_Rica"
});

// Expiry sweep (~every minute): delete STARTED evaluations past expiresAt,
// freeing submission slots. Logged-in judges see the change on their next poll
// of /api/evaluations/timer.
cron.schedule('* * * * *', async () => {
    try {
        const expired = await expireStaleEvaluations();
        if (expired.length > 0) {
            console.log(`Expired ${expired.length} stale evaluation(s)`);
        }
    } catch (err) {
        console.error('Evaluation expiry sweep failed:', err.message);
    }
}, {
    timezone: "America/Costa_Rica"
});
