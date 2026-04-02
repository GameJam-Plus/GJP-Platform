const Jam = require('../models/jamModel');
const Site = require('../models/siteModel');
const User = require('../models/userModel');
const Team = require('../models/teamModel');
const SiteOnJam = require('../models/siteOnJamModel');
const UserOnJam = require('../models/userOnJamModel');
const Submission = require('../models/submissionModel');
const jwt = require('jsonwebtoken');
const userController = require('./userController');
const mongoose = require('mongoose');

// #region PUBLIC FUNCIONS
const createJam = async(req, res) => {
    try{
        // Validate the user
        const creatorUser = await userController.validateUser(req);
        if(!creatorUser)
        {
            return res.status(403).json({success: false, error: 'Session is invalid'});
        }

        const jam = new Jam({
            title: req.body.title,
            open: true,
            public: false,
            sites: [],
            jammers: [],
            toolboxGuides: req.body.toolboxGuides,
            toolboxArts: req.body.toolboxArts,
            toolboxPresentations: req.body.toolboxPresentations,
            themes: req.body.themes,
            categories: req.body.categories,
            stages: req.body.stages,
            creatorUser: {
                userId: creatorUser._id,
                name: creatorUser.name,
                email: creatorUser.email
            },
            creationDate: new Date(),
            lastUpdateUser: {
                userId: creatorUser._id,
                name: creatorUser.name,
                email: creatorUser.email
            },
            lastUpdateDate: new Date()
        });

        await jam.save();
        res.status(200).json({ success: true, msg: 'GameJam created successfully.', jamId: jam._id });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const updateJam = async(req, res) => {
    try{
        // Validate the user
        const creatorUser = await userController.validateUser(req);
        if(!creatorUser)
        {
            return res.status(403).json({success: false, message: 'Session is invalid'});
        }

        const jamId = req.params.id;
        const jam = await Jam.findOne({ _id: jamId });
        if(jam === undefined || jam == null)
        {
            return res.status(400).json({ success: false, message: 'No jam found with that id' });
        }

        jam.title = req.body.title;
        jam.open = req.body.open;
        jam.public = req.body.public;
        jam.toolboxGuides = req.body.toolboxGuides;
        jam.toolboxArts = req.body.toolboxArts;
        jam.toolboxPresentations = req.body.toolboxPresentations;
        jam.themes = req.body.themes;
        jam.categories = req.body.categories;
        jam.stages = req.body.stages;
        jam.lastUpdateUser = {
            userId: creatorUser._id,
            name: creatorUser.name,
            email: creatorUser.email
        };
        jam.lastUpdateDate = new Date();
        
        await jam.save();

        return res.status(200).json({ success: true, message: 'GameJam updated successfully.', jamId: jam._id });
    } catch(error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const deleteJam = async(req, res) => {};

const getCurrentJam = async(req, res) => {
    const jam = await Jam.findOne({ open:true });
    if(jam !== undefined && jam)
    {
        res.status(200).send({ success: true, data: jam });    
    }
    else
    {
        res.status(400).send({ success: false, message: 'No active game jam found' });
    }
};

const listJams = async(req, res) => {
    const jams = await Jam.find({});
    if(jams !== undefined && jams)
    {
        res.status(200).send({ success: true, data: jams });
    }
    else
    {
        res.status(400).send({ success: false, message: 'Error loading jams '});
    }
};

const listOpenJams = async(req, res) => {
    const jams = await Jam.find({ open: true });
    if(jams !== undefined && jams)
    {
        res.status(200).send({ success: true, data: jams });
    }
    else
    {
        res.status(400).send({ success: false, message: 'Error loading jams '});
    }
}


// Joins one site to one open jam
const joinSiteToJam = async(req, res) => {
    const { siteId, jamId } = req.body;
    try{
        const site = await Site.findOne({ _id: siteId });
        const jam = await Jam.findOne({ _id: jamId, open: true });

        if(!site) return res.status(404).json({ success: false, message: "Site is not valid" });
        if(!jam) return res.status(404).json({ success: false, message: "Jam is not valid" });

        const siteOnJam = new SiteOnJam({
            siteId: siteId,
            jamId: jamId
        });

        await siteOnJam.save();
        return res.status(200).json({success: true, data: jam});
        
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

// returns an open gamejam that is linked to a siteID or error if not jam found
const getJamBySite = async(req, res) => {
    const id = req.params.id;

    const jamsOfSite = await SiteOnJam.find({ siteId : id });
    if(jamsOfSite.length <= 0) 
    {
        return res.status(404).send({success: false, message: 'No jam found'});
    }
    
    let jamIds = new Array();
    jamsOfSite.forEach(jam => {
        jamIds.push(jam.jamId);
    });

    const jam = await Jam.findOne({
        _id: { "$in": jamIds },
        open: true
    });

    if(jam)
    {
        return res.status(200).send({success: true, data: jam});
    }
    else{
        return res.status(404).send({success: false, message: 'No jam found'});
    }
};

// returns an open gamejam that is linked to a userID or error if no jam found
const getJamByUser = async(req, res) => {
    try{
        const id = req.params.id;

        const jamsOfUser = await UserOnJam.find({ userId: id });

        if(jamsOfUser.length <= 0) 
        {
            console.log("User has no data.");
            return res.status(404).send({success: false, message: 'No jam found'});
        }

        let jamIds = new Array();
        jamsOfUser.forEach(jam => {
            jamIds.push(jam.jamId);
        });

        const jam = await Jam.findOne({
            _id: { "$in": jamIds },
            open: true
        });

        if(!jam) return res.status(404).send({success: false, message: 'No jam found'});

        const jamOfUser = await UserOnJam.findOne({
            userId: id,
            jamId: jam._id
        });
        //console.log("Jammer data: ", jamOfUser.jammerData);
        const site = await Site.findById(jamOfUser.siteId);

        if(!site) return res.status(400).send({success: false, message: 'Site is invalid'});

        const team = await Team.findOne({
            jamId: jam._id,
            siteId: site._id,
            "jammers._id" : id
        });

        return res.status(200).send({success: true, data: {jam: jam, site: site, team: team, jammerData: jamOfUser.jammerData }});
    } catch(error) {
        if(!jam) return res.status(400).send({success: false, message: error.message});
    }
    
};

const countJamData = async(req, res) => {
    try{
        const jamId = req.params.id;
        let result = {
            siteCount : 0,
            countryCount : 0,
            jammerCount : 0,
            jammerBrazilCount : 0,
            jammerInternacionalCount : 0,
            teamCount : 0,
            submissionCount : 0
        };

        // Find all sites in this jam
        let siteIds = await SiteOnJam.find({ jamId : jamId }, { siteId: 1, _id: 0 });
        siteIds = siteIds.map(site => site.siteId );

        result.siteCount = siteIds.length;

        let countries = await Site.find({ _id: { "$in" : siteIds } }, { country: 1 });
        countries = countries.map(record => record.country.code);
        countries = Array.from(new Set(countries));
        
        result.countryCount = countries.length;

        let jammers = await UserOnJam.countDocuments({ jamId: jamId });

        result.jammerCount = jammers;
        
        let jammersBrazil = await UserOnJam.countDocuments({ 
            jamId: jamId,
            "jammerData.countryOfOrigin": "Brazil"
        });
       result.jammerBrazilCount = jammersBrazil;

       result.jammerInternacionalCount = jammers - jammersBrazil;



        let teams = await Team.countDocuments({ jamId: jamId });

        result.teamCount = teams;

        let submissions = await Submission.countDocuments({ jamId: jamId });

        result.submissionCount = submissions;

        return res.status(200).send({ success: true, data: result });
    } catch(error) {
        return res.status(400).send({ success: false, message: error.message })
    }
}
// #endregion

module.exports = {
    createJam,
    updateJam,
    deleteJam,
    getCurrentJam,
    countJamData,
    getJamBySite,
    getJamByUser,
    joinSiteToJam,
    listJams,
    listOpenJams
};