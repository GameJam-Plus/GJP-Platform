const express = require('express');
const game_jam_route = express();

const bodyParser = require('body-parser');
game_jam_route.use(bodyParser.json());
game_jam_route.use(bodyParser.urlencoded({ extended: true })); 
const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

const jamController = require('../controllers/jamController');

game_jam_route.post('/create-jam', upload.none(), jamController.createJam);
game_jam_route.post('/join-site-jam', upload.none(), jamController.joinSiteToJam);
game_jam_route.put('/update-jam/:id', upload.none(), jamController.updateJam);
game_jam_route.delete('/delete-jam/:id', jamController.deleteJam);
game_jam_route.get('/get-current-jam', jamController.getCurrentJam);
game_jam_route.get('/get-jam-by-site/:id', jamController.getJamBySite);
game_jam_route.get('/get-jam-by-user/:id', jamController.getJamByUser);
game_jam_route.get('/count-jam-data/:id', jamController.countJamData);
game_jam_route.get('/list-jams', jamController.listJams);
game_jam_route.get('/list-open-jams', jamController.listOpenJams);

module.exports = game_jam_route;