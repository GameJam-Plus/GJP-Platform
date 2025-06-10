const Team = require('../models/teamModel');
const GameJam = require('../models/gameJamEventModel');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Site = require('../models/siteModel');
const Region = require('../models/regionModel');
const userController = require('./userController');
const crypto = require('node:crypto');

const createTeam = async (req, res) => {
    // Validate the user
    const creatorUser = await userController.validateUser(req);
    if(!creatorUser)
    {
        return res.status(403).json({success: false, error: 'Session is invalid'});
    }
    try {
        const {teamName, jamId, siteId, jammers} = req.body;

        // Check if the teamName already exists for this jam and site
        let existingTeam = await Team.findOne({ teamName:teamName, jamId:jamId, siteId: siteId });
        if(existingTeam)
        {
            return res.status(400).json({ success: false, message: "There's another team with this name in this site"});
        }

        // Check if any of the jammers in the list has a team
        for(const jammer of jammers){
            existingTeam = await Team.findOne({ siteId: siteId, jamId: jamId, jammers: jammer });
            if(existingTeam)
            {
                return res.status(400).json({ success: false, message: `Jammer with name ${jammer.name} is already assigned to a team`});
            }
        };

        // Generate a unique code for this team (make sure it's a unique code)
        let uniqueCode;
        do
        {
            uniqueCode = crypto.randomBytes(10).toString('hex').slice(0,6).toUpperCase();
            existingTeam = await Team.findOne({ teamCode: uniqueCode , jamId: jamId });
        }
        while(existingTeam);

        // Create the team
        const team = new Team({
            teamName: teamName,
            teamCode: uniqueCode,
            jamId: jamId,
            siteId: siteId,
            jammers: jammers,
            creatorUser: {
                userId: creatorUser._id,
                name: creatorUser.name,
                email: creatorUser.email,
                discordUsername: creatorUser.discordUsername
            },
            creationDate: new Date(),
            lastUpdatedUser: {
                userId: creatorUser._id,
                name: creatorUser.name,
                email: creatorUser.email,
                discordUsername: creatorUser.discordUsername
            },
            lastUpdateDate: new Date()
        });

        await team.save();
        res.status(200).json({ success: true, message: 'Team created successfully', data: team });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const updateTeam = async (req, res) => {
    const teamId = req.params.id;
    const { teamName, jammers } = req.body;
    try {
        const userId = req.cookies.token ? jwt.verify(req.cookies.token, 'MY_JWT_SECRET').userId : null;
        const creatorUser = await User.findById(userId);

        let existingTeam = await Team.findById(teamId);
        if (!existingTeam) {
            return res.status(404).json({ success: false, error: "That team does not exist" });
        }

        existingTeam.teamName = teamName;

        // Update jammer information 
        let jammerIds = new Array();
        for(jammer of jammers)
        {
            jammerIds.push(jammer._id);
        }

        const realJammers = await User.find({
            _id:{ "$in" : jammerIds }
        });

        console.log("Updated Jammers");
        console.log(jammers);

        console.log("Real Jammers:");
        console.log(realJammers);

        let newJammers = new Array();

        realJammers.forEach(oj => {
            const nj = jammers.find(j => j._id == oj._id);
            newJammers.push({
                _id: oj._id,
                name: oj.name,
                email: oj.email,
                discordUsername: oj.discordUsername,
                role: nj.role
            });
        });

        console.log("New Jammers");
        console.log(newJammers);

        existingTeam.jammers = newJammers;

        const updatedTeam = await existingTeam.save();

        res.status(200).json({ success: true, message: 'Team updated successfully', team: updatedTeam });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const getTeam = async(req,res)=>{
    try{
        const {jammerId, siteId, jamId} = req.params;
        if(!jammerId || !mongoose.Types.ObjectId.isValid(jammerId)) return res.status(400).json({ success: false, message: 'Jammer ID is invalid'});
        if(!siteId || !mongoose.Types.ObjectId.isValid(siteId)) return res.status(400).json({ success: false, message: 'Site ID is invalid'});
        if(!jamId || !mongoose.Types.ObjectId.isValid(jamId)) return res.status(400).json({ success: false, message: 'Jam ID is invalid'});
        
        const team = await Team.find({
            jamId: jamId,
            siteId: siteId,
            "jammers._id": jammerId
        })
        
        if(!team) return res.status(404).json({ success: false, message: 'No team found'});
        else return res.status(200).send({ success:true, data: team });
    } catch(error) {
        return res.status(400).send({ success:false, message: error.message });
    }
};

const getTeams = async (req, res) => {
    try {
        const allTeams = await Team.find({});
        res.status(200).send({ success: true, msg: 'Teams have been found in the system', data: allTeams });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

const deleteTeam = async (req, res) => {
    try {
        const id = req.params.id;

        const existingTeam = await Team.findById(id);
        if (!existingTeam) {
            return res.status(404).json({ success: false, error: 'No team found with the provided ID' });
        }

        for (const jammer of existingTeam.jammers) {
            const user = await User.findById(jammer._id);
            if (user) {
                user.team = null;
                await user.save();
            }
        }

        const deletedTeam = await Team.findOneAndDelete({ _id: id });

        if (deletedTeam) {
            res.status(200).send({ success: true, msg: 'Team deleted successfully', data: deletedTeam });
        } else {
            res.status(404).json({ success: false, error: 'No team found with the provided ID' });
        }
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};


const getTeamsBySite = async (req, res) => {
    try {
        const siteId = req.params.site;
        if (!siteId) {
            return res.status(400).send({ success: false, message: "Site is required" });
        }

        const teams = await Team.find({ 'siteId': siteId });
        return res.status(200).send({ success: true, message: `Teams found for site`, data: teams });
    } catch (error) {
        return res.status(500).send({ success: false, msg: error.message });
    }
};


const addJammerToTeam = async (req, res) => {
    const { teamCode, jammerId } = req.params;

    try {
        const team = await Team.findOne({ teamCode: teamCode });
        if (!team) {
            return res.status(404).json({ success: false, error: "Team not found" });
        }

        const jammer = await User.findById(jammerId);
        if (!jammer) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        team.jammers.push({
            _id: jammer._id,
            name: jammer.name,
            email: jammer.email,
            discordUsername: jammer.discordUsername
        });
        await team.save();

        res.status(200).json({ success: true, data: team });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const removeJammerFromTeam = async (req, res) => {
    const teamId = req.params.teamId;
    const jammerId = req.params.jammerId;

    try {
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ success: false, message: "Team not found" });
        }

        const jammerIndex = team.jammers.findIndex(jammer => jammer._id.toString() === jammerId);
        if (jammerIndex === -1) {
            return res.status(404).json({ success: false, message: "Jammer not found in team" });
        }

        const jammer = await User.findById(jammerId);
        if (!jammer) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let role = team.jammers[jammerIndex].role;
        team.jammers.splice(jammerIndex, 1);

        if(team.jammers.length > 0)
        {
            if(role == 'owner') team.jammers[0].role = "owner";
            await team.save();
        }
        else
        {
            await Team.findOneAndDelete({ _id: team._id });
        }

        res.status(200).json({ success: true, message: 'Jammer removed from team successfully', team });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const getCurrentTeamUsers = async (req, res) => {
    const teamId = req.params.teamId;
    
    try {
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ success: false, message: "Team not found" });
        }

        // Get all user IDs from the team
        const userIds = team.jammers.map(jammer => jammer._id);

        // Get current user information from User collection
        const currentUsers = await User.find({
            _id: { $in: userIds }
        });

        // Map the current user data with their roles from the team
        const usersWithRoles = currentUsers.map(user => {
            const teamJammer = team.jammers.find(j => j._id.toString() === user._id.toString());
            return {
                ...user.toObject(),
                role: teamJammer?.role || ''
            };
        });

        res.status(200).json({ 
            success: true, 
            message: 'Current team users retrieved successfully', 
            data: usersWithRoles 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    createTeam,
    updateTeam,
    getTeam,
    getTeams,
    deleteTeam,
    getTeamsBySite,
    addJammerToTeam,
    removeJammerFromTeam,
    getCurrentTeamUsers
};