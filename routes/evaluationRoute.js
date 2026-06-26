const express = require('express');
const evaluation_route = express();

const bodyParser = require('body-parser');
evaluation_route.use(bodyParser.json());
evaluation_route.use(bodyParser.urlencoded({ extended: true }));
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const evaluationController = require('../controllers/evaluationController');

// Auth / role / owner are enforced inline inside each controller (repo
// convention — no central middleware). Annotations below document intent.

// Judge-facing
evaluation_route.get('/timer', evaluationController.getActiveTimer);                       // [auth, Judge]
evaluation_route.post('/start', upload.none(), evaluationController.startEvaluation);      // [auth, Judge]
evaluation_route.get('/mine', evaluationController.getMyEvaluations);                      // [auth, Judge]
evaluation_route.patch('/:id/score', upload.none(), evaluationController.saveScore);       // [auth, Judge, owner]
evaluation_route.patch('/:id/submit', upload.none(), evaluationController.submitEvaluation); // [auth, Judge, owner]

// Organizer-facing
evaluation_route.get('/completed', evaluationController.getCompletedEvaluations);          // [auth, GlobalOrganizer]
evaluation_route.get('/started', evaluationController.getStartedEvaluations);              // [auth, GlobalOrganizer]

// Settings (read by judge+organizer flows; write GlobalOrganizer-only)
evaluation_route.get('/settings', evaluationController.getSettings);                       // [auth]
evaluation_route.put('/settings', upload.none(), evaluationController.updateSettings);     // [auth, GlobalOrganizer]

// expireStaleEvaluations is a cron sweep + lazy call inside startEvaluation — not a route.

module.exports = evaluation_route;
