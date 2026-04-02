const express = require('express');
const team_route = express();

const bodyParser = require('body-parser');
team_route.use(bodyParser.json());
team_route.use(bodyParser.urlencoded({ extended: true })); 

const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

const teamController = require('../controllers/teamController');

team_route.post('/create-team', upload.none(), teamController.createTeam);
team_route.put('/update-team/:id', upload.none(), teamController.updateTeam);
team_route.put('/update-team-owner/:teamId/:jammerId', upload.none(), teamController.updateTeamOwner);
team_route.get('/get-team/:jammerId/:siteId/:jamId', teamController.getTeam);
team_route.get('/get-teams', teamController.getTeams);
team_route.get('/get-teams/:site', teamController.getTeamsBySite);
team_route.get('/get-current-team-users/:teamId', teamController.getCurrentTeamUsers);
team_route.delete('/delete-team/:id', teamController.deleteTeam);
team_route.put('/join-jammer/:teamCode/:jammerId', upload.none(), teamController.addJammerToTeam);
team_route.delete('/remove-jammer/:teamId/:jammerId', teamController.removeJammerFromTeam);

module.exports = team_route;