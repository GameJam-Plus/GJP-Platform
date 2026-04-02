const Submission = require('../models/submissionModel');
const Stage = require('../models/stageModel');
const Category = require('../models/categoryModel');
const GameJam = require('../models/gameJamEventModel');
const Jam = require('../models/jamModel');
const Site = require('../models/siteModel');
const SiteOnJam = require('../models/siteOnJamModel');
const Region = require('../models/regionModel');
const Team = require('../models/teamModel');
const User = require('../models/userModel');
const UserOnJam = require('../models/userOnJamModel');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Theme = require('../models/themeModel')
const { sendScore } = require('../services/mailer');

// Flattens the schema shape: [{ type: Map, of: String }]
// into a simple object: { [category]: url }
const flattenSpecialByCategoryFromDb = (value) => {
    if (!value) return undefined;

    // If already an object (non-array), just return it
    if (typeof value === 'object' && !Array.isArray(value)) {
        // For Map: convert to plain object
        if (value instanceof Map) {
            const out = {};
            for (const [k, v] of value.entries()) out[k] = v;
            return out;
        }
        return value;
    }

    if (!Array.isArray(value)) return undefined;

    const out = {};
    for (const item of value) {
        if (!item) continue;

        if (item instanceof Map) {
            for (const [k, v] of item.entries()) out[k] = v;
            continue;
        }

        if (typeof item === 'object') {
            Object.assign(out, item);
        }
    }

    return Object.keys(out).length > 0 ? out : undefined;
};

const createSubmission = async (req, res) => {
    try {
        const jam = await Jam.findById(req.body.jamId);
        if(!jam) return res.status(400).json({ success: false, message: 'No valid jam found' });
        
        const site = await Site.findById(req.body.siteId);
        if(!site) return res.status(400).json({ success: false, message: 'No valid site found' });
        
        const team = await Team.findById(req.body.teamId);
        if(!team) return res.status(400).json({ success: false, message: 'No valid team found' });
        
        const user = await User.findById(req.body.gamejamContact._id);
        if(!user) return res.status(400).json({ success: false, message: 'Contact user not found' });

        const contact = {
            _id: user._id,
            name: user.name,
            email: user.email
        }
        
        let submission = await Submission.findOne({
            jamId: jam._id,
            siteId: site._id,
            teamId: team._id
        });

        // IF THIS IS A TOTALLY NEW SUBMISSION
        if(!submission) 
        {
            submission = new Submission({
                jamId: jam._id,
                siteId: site._id,
                teamId: team._id,
                
                gamejamJammerId: req.body.gamejamJammerId,
                gamejamTitle: req.body.gamejamTitle,
                gamejamContact: contact,
                gamejamBuild: req.body.gamejamBuild,
                gamejamDescription: req.body.gamejamDescription,
                gamejamThemes: req.body.gamejamThemes,
                gamejamCategories: req.body.gamejamCategories,
                gamejamTopics: req.body.gamejamTopics,
                gamejamGenres: req.body.gamejamGenres,
                gamejamPlatforms: req.body.gamejamPlatforms,
                
                //gamejamSpecialQuestion: req.body.gamejamSpecialQuestion,
                gamejamSpecialByCategory: req.body.gamejamSpecialByCategory,
                gamejamGraphics: req.body.gamejamGraphics,
                gamejamEngine: req.body.gamejamEngine,
                goingToIncubation: req.body.goingToIncubation,
                gamejamAuthorization: req.body.gamejamAuthorization,
                gamejamRecommendation: req.body.gamejamRecommendation,
                gamejamEnjoyment: req.body.gamejamEnjoyment,
                gamejamSuggestions: req.body.gamejamSuggestions,
                gamejamSubmissionTime: new Date(),
                gamejamSubmissionDelta: req.body.gamejamSubmissionDelta
            });
        }
        // IF THIS IS AN EXISTING SUBMISSION FOR THIS TEAM
        else{
            submission.gamejamJammerId = req.body.gamejamJammerId;
            submission.gamejamTitle = req.body.gamejamTitle;
            submission.gamejamContact = contact;
            submission.gamejamBuild = req.body.gamejamBuild;
            submission.gamejamDescription = req.body.gamejamDescription;
            submission.gamejamThemes = req.body.gamejamThemes;
            submission.gamejamCategories = req.body.gamejamCategories;
            submission.gamejamTopics = req.body.gamejamTopics;
            submission.gamejamGenres = req.body.gamejamGenres;
            submission.gamejamPlatforms = req.body.gamejamPlatforms;
            //submission.gamejamSpecialQuestion = req.body.gamejamSpecialQuestion;
            submission.gamejamSpecialByCategory = req.body.gamejamSpecialByCategory;
            submission.gamejam = req.body.incubationSpecialByCategory;
            submission.gamejamGraphics = req.body.gamejamGraphics;
            submission.gamejamEngine = req.body.gamejamEngine;
            submission.goingToIncubation = req.body.goingToIncubation;
            submission.gamejamAuthorization = req.body.gamejamAuthorization;
            submission.gamejamRecommendation = req.body.gamejamRecommendation;
            submission.gamejamEnjoyment = req.body.gamejamEnjoyment;
            submission.gamejamSuggestions = req.body.gamejamSuggestions;
            submission.gamejamSubmissionTime = new Date();
            submission.gamejamSubmissionDelta = req.body.gamejamSubmissionDelta;
        }
        submission = await submission.save();
        return res.status(200).json({ success: true, message: 'Submission created successfully', data: submission });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

const updateGamejamPitch = async(req, res) => {
    try
    {
        const jamId = req.body.jamId;
        const siteId = req.body.siteId;
        const teamId = req.body.teamId;

        console.log("Gamejam pitch:\n", req.body);

        let updateValue = {};
        updateValue.gamejamPitch = req.body.gamejamPitch;
        updateValue.gamejamPitchDelta = req.body.gamejamPitchDelta;
        updateValue.gamejamPitchTime = new Date();
        updateValue.gamejamPitchJammerId = req.body.gamejamPitchJammerId;
        
        await Submission.updateOne({
            jamId: jamId,
            siteId: siteId,
            teamId: teamId
        }, updateValue );

        const submission = await Submission.findOne({
            jamId: jamId,
            siteId: siteId,
            teamId: teamId
        });
        
        return res.status(200).json({ success: true, data: submission });
    } catch(error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

const updateIncubation = async(req, res) => {
    try {
        const jam = await Jam.findById(req.body.jamId);
        if(!jam) return res.status(400).json({ success: false, message: 'No valid jam found' });
        
        const site = await Site.findById(req.body.siteId);
        if(!site) return res.status(400).json({ success: false, message: 'No valid site found' });
        
        const team = await Team.findById(req.body.teamId);
        if(!team) return res.status(400).json({ success: false, message: 'No valid team found' });

        const user = await User.findById(req.body.incubationContact._id);
        if(!user) return res.status(400).json({ success: false, message: 'Contact user not found' });

        const contact = {
            _id: user._id,
            name: user.name,
            email: user.email
        }

        let updateValue = {};
        updateValue.incubationTitle = req.body.incubationTitle;
        updateValue.incubationBuild = req.body.incubationBuild;
        updateValue.incubationGameplay = req.body.incubationGameplay;
        updateValue.incubationContact = contact;
        updateValue.incubationDescription = req.body.incubationDescription;
        updateValue.incubationGenres = req.body.incubationGenres;
        updateValue.incubationTopics = req.body.incubationTopics;
        updateValue.incubationThemes = req.body.incubationThemes;
        updateValue.incubationCategories = req.body.incubationCategories;
        updateValue.incubationPlatforms = req.body.incubationPlatforms;
        //updateValue.incubationSpecialQuestion = req.body.incubationSpecialQuestion;
        updateValue.incubationSpecialByCategory = req.body.incubationSpecialByCategory;
        updateValue.incubationGraphics = req.body.incubationGraphics;
        updateValue.incubationEngine = req.body.incubationEngine;
        updateValue.goingToAcceleration = req.body.goingToAcceleration;
        updateValue.incubationRecommendation = req.body.incubationRecommendation;
        updateValue.incubationEnjoyment = req.body.incubationEnjoyment;
        updateValue.incubationSuggestions = req.body.incubationSuggestions;
        updateValue.incubationAuthorization = req.body.incubationAuthorization;
        updateValue.incubationSubmissionTime = new Date();
        updateValue.incubationSubmissionDelta = req.body.incubationSubmissionDelta;
        
        await Submission.updateOne({
            jamId: jam._id,
            siteId: site._id,
            teamId: team._id
        }, updateValue );
        
        const updatedSubmission = await Submission.findOne({
            jamId: jam._id,
            siteId: site._id,
            teamId: team._id
        });

        return res.status(200).json({ success: true, data: updatedSubmission });
    } catch(error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

const updateIncubationPitch = async(req, res) => {
    try
    {
        const jamId = req.body.jamId;
        const siteId = req.body.siteId;
        const teamId = req.body.teamId;

        console.log("Incubation pitch:\n", req.body);

        let updateValue = {};
        updateValue.incubationPitchJammerId = req.body.incubationPitchJammerId;
        updateValue.incubationPitch = req.body.incubationPitch;
        updateValue.incubationPitchTime = new Date();
        updateValue.incubationPitchDelta = req.body.incubationPitchDelta;
        
        await Submission.updateOne({
            jamId: jamId,
            siteId: siteId,
            teamId: teamId
        }, updateValue );

        const submission = await Submission.findOne({
            jamId: jamId,
            siteId: siteId,
            teamId: teamId
        });
        
        return res.status(200).json({ success: true, data: submission });
    } catch(error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

const updateAcceleration = async(req, res) => {
    try
    {
        const jam = await Jam.findById(req.body.jamId);
        if(!jam) return res.status(400).json({ success: false, message: 'No valid jam found' });
        
        const site = await Site.findById(req.body.siteId);
        if(!site) return res.status(400).json({ success: false, message: 'No valid site found' });
        
        const team = await Team.findById(req.body.teamId);
        if(!team) return res.status(400).json({ success: false, message: 'No valid team found' });

        const user = await User.findById(req.body.accelerationContact._id);
        if(!user) return res.status(400).json({ success: false, message: 'Contact user not found' });

        const contact = {
            _id: user._id,
            name: user.name,
            email: user.email
        }
        
        let updateValue = {};
        updateValue.acclerationJammerId = req.body.acclerationJammerId;
        updateValue.accelerationTitle = req.body.accelerationTitle;
        updateValue.accelerationBuild = req.body.accelerationBuild;
        updateValue.accelerationGameplay = req.body.accelerationGameplay;
        updateValue.accelerationContact = contact;
        updateValue.accelerationDescription = req.body.accelerationDescription;
        updateValue.accelerationGenres = req.body.accelerationGenres;
        updateValue.accelerationTopics = req.body.accelerationTopics;
        updateValue.accelerationThemes = req.body.accelerationThemes;
        updateValue.accelerationCategories = req.body.accelerationCategories;
        updateValue.accelerationPlatforms = req.body.accelerationPlatforms;
        //updateValue.accelerationSpecialQuestion = req.body.accelerationSpecialQuestion;
        updateValue.accelerationSpecialByCategory = req.body.accelerationSpecialByCategory;
        updateValue.accelerationGraphics = req.body.accelerationGraphics;
        updateValue.accelerationEngine = req.body.accelerationEngine;
        updateValue.accelerationRecommendation = req.body.accelerationRecommendation;
        updateValue.accelerationEnjoyment = req.body.accelerationEnjoyment;
        updateValue.accelerationSuggestions = req.body.accelerationSuggestions;
        updateValue.accelerationAuthorization = req.body.accelerationAuthorization;
        updateValue.accelerationSubmissionTime = new Date();
        updateValue.accelerationSubmissionDelta = req.body.accelerationSubmissionDelta;
                
        await Submission.updateOne({
            jamId: jam._id,
            siteId: site._id,
            teamId: team._id
        }, updateValue );
        
        const updatedSubmission = await Submission.findOne({
            jamId: jam._id,
            siteId: site._id,
            teamId: team._id
        });

        return res.status(200).json({ success: true, data: updatedSubmission });
    } catch(error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

const updateAccelerationPitch = async(req, res) => {
    try
    {
        const jamId = req.body.jamId;
        const siteId = req.body.siteId;
        const teamId = req.body.teamId;

        console.log("Acceleration pitch:\n", req.body);

        let updateValue = {};
        updateValue.accelerationPitchJammerId = req.body.accelerationPitchJammerId;
        updateValue.accelerationPitch = req.body.accelerationPitch;
        updateValue.accelerationPitchTime = new Date();
        updateValue.accelerationPitchDelta = req.body.accelerationPitchDelta;
        
        await Submission.updateOne({
            jamId: jamId,
            siteId: siteId,
            teamId: teamId
        }, updateValue );

        const submission = await Submission.findOne({
            jamId: jamId,
            siteId: siteId,
            teamId: teamId
        });
        
        return res.status(200).json({ success: true, data: submission });
    } catch(error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

const getSubmissionByTeam = async(req, res) => {
    try { 
        let submission = await Submission.findOne({ teamId: req.params.teamId });

        if(!submission) return res.status(404).json({ success: false, message: "No valid submission found" });

        // Flatten incubationSpecialByCategory so the frontend can treat it as { [category]: url }
        const submissionObj = typeof submission.toObject === 'function' ? submission.toObject() : submission;
        submissionObj.incubationSpecialByCategory = flattenSpecialByCategoryFromDb(submissionObj.incubationSpecialByCategory);

        return res.status(200).json({ success: true, data: submissionObj });
    } catch(error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

const getSubmissionsBySite = async(req,res) => {
    try{
        const siteId = req.params.siteId;
        const jamId = req.params.jamId;

        const submissions = await Submission.find({ siteId: siteId, jamId: jamId });
        let submissionList = new Array();
        for(let s = 0; s < submissions.length; ++s)
        {
            let submission = submissions[s].toObject();
            const team = await Team.findById(submission.teamId);
            if(team) submission.teamName = team.teamName;
            submissionList.push(submission);
        }

        return res.status(200).json({ success: true, data: submissionList });
    } catch(error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

const getSubmissionsByJam = async(req,res) => {
    try{
        const jamId = req.params.jamId;

        const submissions = await Submission.find({ jamId: jamId });
        let submissionList = new Array();
        for(let s = 0; s < submissions.length; ++s)
        {
            let submission = submissions[s].toObject();
            const team = await Team.findById(submission.teamId);
            if(team) submission.teamName = team.teamName;

            const site = await Site.findById(submission.siteId);
            if(site) {
                submission.site = site.name;
                submission.country = site.country.name;

                const region = await Region.findById(site.regionId);

                if(region) submission.region = region.name;
            }
            submissionList.push(submission);
        }

        return res.status(200).json({ success: true, data: submissionList });
    } catch(error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

const getCurrentTeamSubmission = async (req, res) => {
    const { teamId, stageId } = req.params;

    try {
        const selectedSubmission = await Submission.findOne({ teamId: teamId, stageId: stageId });

        if (!selectedSubmission) {
            return res.status(404).json({ success: false, error: 'No submission found for the specified team and stage.' });
        }

        res.status(200).json({ success: true, msg: 'Submission found successfully.', data: selectedSubmission });
    } catch (error) {
        res.status(400).json({ success: false, error: 'Error processing the request.' });
    }
};

const getSubmissionName = async (req, res) => {
    try {
        const name = req.params.name;

        if (!name) {
            return res.status(400).json({ success: false, error: 'Se requiere el nombre del juego.' });
        }

        const existingSubmission = await Submission.findOne({ title: name });
        if (!existingSubmission) {
            return res.status(404).json({ success: false, error: "Esa entrega no existe" });
        }

        res.status(200).send({ success: true, msg: 'Entrega encontrada correctamente', data: existingSubmission });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

const getSubmission = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'El ID de entrega proporcionado no es válido.' });
        } else {
            const existingSubmission = await Submission.findById(id);
            if (!existingSubmission) {
                return res.status(404).json({ success: false, error: "Esa entrega no existe" });
            }
        }
        const selectedSubmission = await Submission.findById(id);
        res.status(200).send({ success: true, msg: 'Entrega encontrada correctamente', data: selectedSubmission });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

const getSubmissions = async (req, res) => {
    try {
        console.log("GET SUBMISSIONS");
        const allSubmissions = await Submission.find({});
        res.status(200).send({ success: true, msg: 'Se han encontrado entregas en el sistema', data: allSubmissions });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

const getSubmissionsData = async (req, res) => {
    try{
        const jamId = req.params.jamId;
        let activeJammers = new Array();
        let inactiveJammers = new Array();
        let submissionData = new Array();
        let errors = new Array();
        const jammerInfo = await UserOnJam.find({ jamId: jamId });
        for(let i = 0; i < jammerInfo.length; ++i)
        {
            try{
                let jammer = await User.findById(jammerInfo[i].userId);
                let site = await Site.findById(jammerInfo[i].siteId);
                let region = await Region.findById(site.regionId);
                let team = await Team.findOne({ "jammers._id": jammerInfo[i].userId });
                let submission;
                if(team) submission = await Submission.findOne({ teamId: team._id });

                jammer = jammer.toObject();
                jammer.jammerData = jammerInfo[i].jammerData;
                jammer.regionName = region.name;
                jammer.siteName = site.name;
                jammer.countryName = site.country.name;
                jammer.countryCode = site.country.code;

                if(team)
                {
                    jammer.teamName = team.teamName;
                }
                else
                {
                    jammer.teamName = "NONE";
                }

                // Get the most recent information: acceleration -> incubation -> gamejam
                if(submission)
                {
                    if(submission.accelerationTitle) {
                        jammer.submissionTitle = submission.accelerationTitle;
                        jammer.submissionLink = submission.accelerationBuild ? submission.accelerationBuild : "NONE";
                        jammer.pitchLink = submission.accelerationPitch ? submission.accelerationPitch : "NONE";
                        jammer.incubation = submission.goingToIncubation;
                        jammer.acceleration = submission.goingToAcceleration;
                        jammer.submissionTime = submission.accelerationSubmissionTime;
                        jammer.pitchTime = submission.accelerationPitchTime;
                    }
                    else if (submission.incubationTitle)
                    {
                        jammer.submissionTitle = submission.incubationTitle;
                        jammer.submissionLink = submission.incubationBuild ? submission.incubationBuild : "NONE";
                        jammer.pitchLink = submission.incubationPitch ? submission.incubationPitch : "NONE";
                        jammer.incubation = submission.goingToIncubation;
                        jammer.acceleration = submission.goingToAcceleration;
                        jammer.submissionTime = submission.incubationSubmissionTime;
                        jammer.pitchTime = submission.incubationPitchTime;
                    }
                    else {
                        jammer.submissionTitle = submission.gamejamTitle;
                        jammer.submissionLink = submission.gamejamBuild ? submission.gamejamBuild : "NONE";
                        jammer.pitchLink = submission.gamejamPitch ? submission.gamejamPitch : "NONE";
                        jammer.incubation = submission.goingToIncubation;
                        jammer.acceleration = submission.goingToAcceleration;
                        jammer.submissionTime = submission.gamejamSubmissionTime;
                        jammer.pitchTime = submission.gamejamPitchTime;
                    }
                }
                else
                {
                    jammer.submissionTitle = "NONE";
                    jammer.submissionLink = "NONE";
                    jammer.pitchLink = "NONE";
                    jammer.incubation = false;
                    jammer.acceleration = false;
                }

                if(jammer.incubation) activeJammers.push(jammer);
                else inactiveJammers.push(jammer);
            }
            catch(error)
            {
                errors.push({
                    userId: jammerInfo[i].userId,
                    message: error.message
                })
            }
        }

        const submissions = await Submission.find({
            jamId: jamId
        });

        for(let i = 0; i < submissions.length; ++i)
        {
            try
            {
                const teamId = submissions[i].teamId;
                const siteId = submissions[i].siteId;
                const team = await Team.findOne({ _id: teamId });
                const site = await Site.findOne({ _id: siteId });
                const regionId = site.regionId;
                const region = await Region.findOne({ _id: regionId });
                
                // Check contact from latest to earliest step: acceleration -> incubation -> gamejam
                let contact = null;
                if (submissions[i].accelerationContact && submissions[i].accelerationContact._id) {
                    contact = submissions[i].accelerationContact;
                } else if (submissions[i].incubationContact && submissions[i].incubationContact._id) {
                    contact = submissions[i].incubationContact;
                } else if (submissions[i].gamejamContact && submissions[i].gamejamContact._id) {
                    contact = submissions[i].gamejamContact;
                }
                
                submissionData.push({
                    submissionId: submissions[i]._id,
                    region: region.name,
                    country: site.country.name,
                    site: site.name,
                    team: team.teamName,
                    contactId: contact ? contact._id : null,
                    contactName: contact ? contact.name : null,
                    contactEmail: contact ? contact.email : null,
                    title: submissions[i].title,
                    link: submissions[i].link,
                    pitch: submissions[i].pitch,
                    themes: submissions[i].themes,
                    categories: submissions[i].categories,
                    topics: submissions[i].topics,
                    genres: submissions[i].genres,
                    platforms: submissions[i].platforms,
                    incubation: submissions[i].incubation,
                    acceleration: submissions[i].acceleration,
                    submissionTime: submissions[i].submissionTime,
                    pitchTime: submissions[i].pitchTime  
                });
            }
            catch(error)
            {
                console.log("Submission data error: " + error.message);
            }
        }

        res.status(200).send({ success: true, data: {activeJammers: activeJammers, inactiveJammers: inactiveJammers, submissions: submissionData, errors: errors} });
    } catch (error) {
        res.status(400).send({ success: false, message: error.message });
    }
};

const getSubmissionsSite = async (req, res) => {
    try {
        const siteId = req.params.id;
        
        const teams = await Team.find({ 'site._id': siteId });

        const teamIds = teams.map(team => team._id);

        const allSubmissions = await Submission.find({ teamId: { $in: teamIds } })
            .populate('teamId', 'studioName')
            .select('title teamId');

        const submissionsArray = allSubmissions.map(submission => ({
            id: submission._id,
            name: submission.title,
            team: submission.teamId.studioName
        }));

        res.status(200).send({ success: true, msg: 'Submissions found in the system', data: submissionsArray });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

const getSubmissionsSiteName = async (req, res) => {
    try {
        const siteName = req.params.name;

        // Buscar equipos por nombre del sitio
        const teams = await Team.find({ 'site.name': { $regex: new RegExp(siteName, "i") } });
        const teamIds = teams.map(team => team._id);

        // Si no se encontraron equipos, enviar un mensaje de error
        if (teamIds.length === 0) {
            throw new Error('No teams found for the provided site name');
        }

        // Buscar presentaciones por los IDs de los equipos encontrados
        const allSubmissions = await Submission.find({ teamId: { $in: teamIds } })
            .populate('teamId', 'studioName')
            .select('title teamId');

        const submissionsArray = allSubmissions.map(submission => ({
            id: submission._id,
            name: submission.title,
            team: submission.teamId.studioName
        }));

        res.status(200).send({ success: true, msg: 'Submissions found in the system', data: submissionsArray });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

const deleteSubmission = async (req, res) => {
    try {
        const id = req.params.id;

        const deletedSubmission = await Submission.findOneAndDelete({ _id: id });

        if (deletedSubmission) {
            await Team.updateOne({ _id: deletedSubmission.team }, { $pull: { submissions: deletedSubmission._id } });

            res.status(200).send({ success: true, msg: 'Entrega eliminada correctamente', data: deletedSubmission });
        } else {
            res.status(404).json({ success: false, error: 'No se encontró la entrega con el ID proporcionado' });
        }
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

const giveRating = async (req, res) => {
    try {
        const userId = req.cookies.token ? jwt.verify(req.cookies.token, 'MY_JWT_SECRET').userId : null;

        if (!userId) {
            return res.status(401).json({ success: false, msg: 'Unauthorized' });
        }

        const { submissionId,
            continuityPotential,
            audienceCompetitorAwarenessValue,
            marketPositioningValue,
            gameDesignCoreLoopValue,
            gameDesignHookValue,
            gameDesignBalanceValue,
            artVisualsCoherenceQualityValue,
            audioDesignCoherenceQualityValue,
            buildQualityValue,
            UIUXQualityValue,
            narrativeWorldBuildingValue,
            pitchFeedback,
            gameDesignFeedback,
            artVisualsFeedback,
            audioDesignFeedback,
            buildFeedback,
            personalFeedback
        } = req.body;

        const submission = await Submission.findById(submissionId);

        if (!submission) {
            return res.status(404).json({ message: 'El submission no fue encontrado.' });
        }

        const team = await Team.findById(submission.teamId);

        if (!team) {
            return res.status(404).json({ success: false, msg: 'Team not found' });
        }

        let evaluator = null;
        const evaluatorss = submission.evaluators;
        for (const e of evaluatorss) {
            if (e.userId == userId) {
                evaluator = e;
                break; 
            }
        }

        if (!evaluator) {
            return res.status(404).json({ message: 'Este juego no está asignado al usuario juez actual.' });
        }

        evaluator.continuityPotential = continuityPotential;
        evaluator.audienceCompetitorAwarenessValue = audienceCompetitorAwarenessValue;
        evaluator.marketPositioningValue = marketPositioningValue;
        evaluator.gameDesignCoreLoopValue = gameDesignCoreLoopValue;
        evaluator.gameDesignHookValue = gameDesignHookValue;
        evaluator.gameDesignBalanceValue = gameDesignBalanceValue;
        evaluator.artVisualsCoherenceQualityValue = artVisualsCoherenceQualityValue;
        evaluator.audioDesignCoherenceQualityValue = audioDesignCoherenceQualityValue;
        evaluator.buildQualityValue = buildQualityValue;
        evaluator.UIUXQualityValue = UIUXQualityValue;
        evaluator.narrativeWorldBuildingValue = narrativeWorldBuildingValue;
        evaluator.pitchFeedback = pitchFeedback;
        evaluator.gameDesignFeedback = gameDesignFeedback;
        evaluator.artVisualsFeedback = artVisualsFeedback;
        evaluator.audioDesignFeedback = audioDesignFeedback;
        evaluator.buildFeedback = buildFeedback;
        evaluator.personalFeedback = personalFeedback;

        await submission.save();

        /*const promises = [];

        for (const jammer of team.jammers) {
            const subject = 'Score Update on GameJam Platform';
            
            const emailPromise = sendScore(
                jammer.email,
                subject,
                continuityPotential,
                audienceCompetitorAwarenessValue,
                marketPositioningValue,
                gameDesignCoreLoopValue,
                gameDesignHookValue,
                gameDesignBalanceValue,
                artVisualsCoherenceQualityValue,
                audioDesignCoherenceQualityValue,
                buildQualityValue,
                UIUXQualityValue,
                narrativeWorldBuildingValue,
                pitchFeedback,
                gameDesignFeedback,
                artVisualsFeedback,
                audioDesignFeedback,
                buildFeedback,
                personalFeedback
            );
            promises.push(emailPromise);
        }        

        await Promise.all(promises);*/

        res.status(200).json({ success: true, msg: 'Juego calificado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: 'Internal Server Error' });
    }
}

const getRating = async (req, res) => {
    try {
        const userId = req.cookies.token ? jwt.verify(req.cookies.token, 'MY_JWT_SECRET').userId : null;

        if (!userId) {
            return res.status(401).json({ success: false, msg: 'Unauthorized' });
        }

        const { submissionId } = req.params;

        const submission = await Submission.findById(submissionId);
        if (!submission) {
            return res.status(404).json({ message: 'The submission was not found.' });
        }

        let evaluator = null;
        const evaluators = submission.evaluators;
        for (const e of evaluators) {
            if (e.userId == userId) {
                evaluator = e;
                break; 
            }
        }
        if (!evaluator) {
            return res.status(404).json({ message: 'This game is not assigned to the current judge user.' });
        }

        const response = {
            continuityPotential: evaluator.continuityPotential,
            audienceCompetitorAwarenessValue: evaluator.audienceCompetitorAwarenessValue,
            marketPositioningValue: evaluator.marketPositioningValue,
            gameDesignCoreLoopValue: evaluator.gameDesignCoreLoopValue,
            gameDesignHookValue: evaluator.gameDesignHookValue,
            gameDesignBalanceValue: evaluator.gameDesignBalanceValue,
            artVisualsCoherenceQualityValue: evaluator.artVisualsCoherenceQualityValue,
            audioDesignCoherenceQualityValue: evaluator.audioDesignCoherenceQualityValue,
            buildQualityValue: evaluator.buildQualityValue,
            UIUXQualityValue: evaluator.UIUXQualityValue,
            narrativeWorldBuildingValue: evaluator.narrativeWorldBuildingValue,
            pitchFeedback: evaluator.pitchFeedback,
            gameDesignFeedback: evaluator.gameDesignFeedback,
            artVisualsFeedback: evaluator.artVisualsFeedback,
            audioDesignFeedback: evaluator.audioDesignFeedback,
            buildFeedback: evaluator.buildFeedback,
            personalFeedback: evaluator.personalFeedback
        };

        res.status(200).send({ success: true, msg: 'Rating found successfully', data: response });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

const setEvaluatorToSubmission = async (req, res) => {
    try {
        const evaluatorId = req.cookies.token ? jwt.verify(req.cookies.token, 'MY_JWT_SECRET').userId : null;

        const creatorUser = await User.findById(evaluatorId);
        if (!creatorUser) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const currentDate = new Date();
        const allGameJams = await GameJam.find({});
        let stageIdFound = null;

        for (const gameJam of allGameJams) {
            for (const stage of gameJam.stages) {
                if (currentDate >= stage.startDateEvaluation && currentDate <= stage.endDateEvaluation) {
                    stageIdFound = stage._id;
                    break;
                }
            }
            if (stageIdFound) {
                break;
            }
        }

        if (!stageIdFound) {
            return res.status(404).json({ message: 'No active stage found.' });
        }

        const submissions = await Submission.find({ stageId: stageIdFound });

        if (submissions.length === 0) {
            return res.status(404).json({ message: 'No submissions available for evaluation in this stage.' });
        }

        let minCount = Infinity; 
        submissions.forEach(submission => {
            let count = 0;
            submission.evaluators.forEach(evaluator => {
                if (evaluator.pitchScore !== undefined) {
                    count++;
                }
            });
            if (count < minCount) {
                minCount = count;
            }
        });

        const submissionsWithMinEvaluators = submissions.filter(submission => {
            let count = 0;
            submission.evaluators.forEach(evaluator => {
                if (evaluator.pitchScore !== undefined) {
                    count++;
                }
            });
            return count === minCount;
        });

        const randomSubmission = submissionsWithMinEvaluators[Math.floor(Math.random() * submissionsWithMinEvaluators.length)];
        
        const existingEvaluator = randomSubmission.evaluators.find(evaluator => evaluator.userId.toString() === evaluatorId.toString());
        if (existingEvaluator) {
            return res.status(400).json({ message: 'Evaluator already associated.' });
        }        
        randomSubmission.evaluators.push({ userId: evaluatorId, name: creatorUser.name, email: creatorUser.email });
        await randomSubmission.save();

        res.status(200).json({ message: 'Evaluator successfully added to the submission.', data: randomSubmission });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred.' });
    }
};

const getSubmissionsEvaluator = async (req, res) => {
    try {
        const evaluatorID = req.params.id;
        const Submissions = await Submission.find({
            'evaluators.userId': evaluatorID,
            $or: [
                { "evaluators.UIUXQualityValue": null },
            ]
        });

        res.status(200).send({ success: true, msg: 'There are submissions in the system', data: Submissions });
    } catch (error) {
        res.status(400).json({ success: false, error: 'Error while processing the request.' });
    }
};

const getRatingsEvaluator = async (req, res) => {
    try {
        const evaluatorID = req.params.id;
        const Submissions = await Submission.find({
            'evaluators.userId': evaluatorID,
            $and: [
                { "evaluators.UIUXQualityValue": { $exists: true, $ne: null } }
            ]
        });
        res.status(200).send({ success: true, msg: 'There are ratings in the system', data: Submissions });
    }
    catch {
        res.status(400).json({ success: false, error: 'Error processing the request.' });
    }
};

module.exports = {
    createSubmission,
    updateGamejamPitch,
    updateIncubation,
    updateIncubationPitch,
    updateAcceleration,
    updateAccelerationPitch,
    getSubmissionByTeam,
    getSubmissionsBySite,
    getSubmissionsByJam,
    getSubmissionsData,
    getCurrentTeamSubmission,
    getSubmission,
    getSubmissions,
    deleteSubmission,
    setEvaluatorToSubmission,
    giveRating,
    getRating,
    getSubmissionsEvaluator,
    getRatingsEvaluator,
    getSubmissionsSiteName,
    getSubmissionName
};