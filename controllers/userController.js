const User = require('../models/userModel');
const Team = require('../models/teamModel');
const Site = require('../models/siteModel');
const Jam = require('../models/jamModel');
const UserOnJam = require('../models/userOnJamModel');
const gamejamController = require('../controllers/gameJamController');
const { sendEmail } = require('../services/mailer');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const { deepEqual } = require('assert');
const crypto = require('node:crypto');

const registerUser = async (req, res) => {
    const { name, email, region, site, team, roles, coins, discordUsername, instagram, linkedin, telefoneWhatsApp, ethnicity, gender, intersex, identity, orientation, disability, participation, student, school } = req.body;

    try {
        // Validar email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(403).json({ success: false, message: 'Invalid email address.' });
        }

        // Verificar si el email ya está registrado
        
        const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingEmail) {
            return res.status(409).json({ success: false, message: "The email is already in use." });
        }

        // Verificar si el nombre de usuario de Discord ya está registrado
        const existingDiscordUsername = await User.findOne({ discordUsername: discordUsername });
        if (existingDiscordUsername) {
            return res.status(409).json({ success: false, message: "The Discord Username is already in use." });
        }

        //Verificar outras informações como nome
        
        // Crear nuevo usuario
        const user = new User({
            name: name,
            email: email.toLowerCase().trim(),
            region: region ? { _id: region._id, name: region.name } : undefined,
            site: site ? { _id: site._id, name: site.name } : undefined,
            team: team ? { _id: team._id, name: team.name } : undefined,
            roles: roles,
            coins: coins,
            discordUsername: discordUsername,
            instagram: instagram,
            linkedin: linkedin,
            telefoneWhatsApp: telefoneWhatsApp,
            ethnicity: ethnicity,
            gender: gender,
            intersex: intersex,
            identity: identity,
            orientation: orientation,
            disability: disability, //se tem alguma deficiencia
            participation: participation, //se ja participou de GJ+ anteriores
            student: student,         //se é estudante ou não
            school: school, //nome local que estuda
            creationDate: new Date()
        });
        

        // Guardar usuario en la base de datos
        await user.save();
        res.status(200).json({ success: true, message: 'Registered successfully', userId: user._id });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};


const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, region, site, team, roles, coins, discordUsername, instagram, linkedin, telefoneWhatsApp, ethnicity, gender, intersex, identity, orientation, disability, participation, student, school } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID.' });
        }

        const existingUser = await User.findById(id);
        if (!existingUser) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (email && email !== existingUser.email) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(403).json({ success: false, message: 'Invalid email address.' });
            }
            const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
            if (emailExists) {
                return res.status(409).json({ success: false, message: 'The email is already in use.' });
            }
            existingUser.email = email.toLowerCase().trim();
        }

        if (name) existingUser.name = name;
        if (region) existingUser.region = { _id: region._id, name: region.name };
        else existingUser.region = undefined;
        if (site) existingUser.site = { _id: site._id, name: site.name };
        else existingUser.site = undefined;
        if (team) existingUser.team = { _id: team._id, name: team.name };
        if (roles) existingUser.roles = roles;
        if (coins) existingUser.coins = coins;
        if (discordUsername) existingUser.discordUsername = discordUsername;
        if (instagram) existingUser.instagram = instagram;
        if (linkedin) existingUser.linkedin = linkedin;
        if (telefoneWhatsApp) existingUser.telefoneWhatsApp = telefoneWhatsApp;
        if (ethnicity) existingUser.ethnicity = ethnicity;
        if (gender) existingUser.gender = gender;
        if (intersex) existingUser.intersex = intersex;
        if (identity) existingUser.identity = identity;
        if (orientation) existingUser.orientation = orientation;
        if (disability) existingUser.disability = disability;
        if (participation) existingUser.participation = participation;
        if (student) existingUser.student = student;
        if (school) existingUser.school = school;
        
        if(existingUser.roles.includes('Jammer')){
            const query = { 'jammers._id': id };

            const updateFieldsQuery = {
                $set: {
                    'jammers.$.name': name,
                    'jammers.$.email': email
                }
            };

            Team.updateMany(query, updateFieldsQuery)
                .then(result => {
                    console.log("Jammer fields updated successfully:", result);
                })
                .catch(error => {
                    console.error('Error updating Jammer fields:', error);
                });
        }


        /*if (rol === 'Jammer') {
            const query = { 'jammers._id': id };

            const updateFieldsQuery = {
                $set: {
                    'jammers.$.name': name,
                    'jammers.$.email': email
                }
            };

            Team.updateMany(query, updateFieldsQuery)
                .then(result => {
                    console.log("Jammer fields updated successfully:", result);
                })
                .catch(error => {
                    console.error('Error updating Jammer fields:', error);
                });
        }*/
        existingUser.lastUpdateDate = new Date();

        await existingUser.save();

        res.status(200).json({ success: true, message: 'User updated successfully.' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const loginUser = async (req, res) => {
    try{
        const email = req.body.email.toLowerCase().trim();
        const existingUser = await User.findOne({ email });
        let roles;
        let userId;

        if (!existingUser) {
            const registerLink = `${process.env.URL}/register`;
            const subject = 'Register in GameJam Platform';
            const message = `Hi, click on this link to create an account:`;
            const link = registerLink;
            await sendEmail(email, subject, message, link);
            return res.status(200).json({ success: true, msg: `Register form sent to user's email`, email, registerLink });
        }
        else
        {
            roles = existingUser.roles;
            userId = existingUser._id;
        
            const token = jwt.sign({ userId, roles }, 'MY_JWT_SECRET', { expiresIn: 6000000 });
            const magicLink = `${process.env.URL}/api/user/magic-link/${token}`;
            const subject = 'Login in GameJam Platform';
            const message = `Hi, click on this link to continue to the platform:`;
            const link = magicLink;
            await sendEmail(email, subject, message, link);
            return res.status(200).json({ success: true, msg: `Magic Link sent to user's email`, email });
        }
    }catch(error){
        return res.status(400).send.json({ success: false, message: error.message })
    }
};

const getLoginLink = async (req, res) => {
    try{
        if(process.env.TARGET == "DEV")
        {
            const email = req.body.email.toLowerCase().trim();
            console.log(`Login using dev backdoor with email ${email} - ${new Date()}`);
            const user = await User.findOne({ email: email });
            if(!user) return res.status(403).json({success: false, message: "Invalid email"});
            const userId = user._id;
            const roles = user.roles;
            const token = jwt.sign({ userId, roles }, 'MY_JWT_SECRET', { expiresIn: 6000000 });
            console.log(`${process.env.URL}/api/user/magic-link/${token}`);
            
            return res.status(200).json({ success: true, message: "Link sent to console" });
        }
        else
        {
            return res.status(403).json({success: false, message: "This action is not permitted"});
        }
    }catch(error){
        return res.status(400).json({success: false, message: error.message});
    }
}


const magicLink = async (req, res) => {
    try {
        const token = req.params.token;
        const decodedToken = jwt.verify(token, 'MY_JWT_SECRET');
        const userId = decodedToken.userId;
        const roles = decodedToken.roles;

        const newToken = jwt.sign({ userId, roles }, 'MY_JWT_SECRET');

        res.cookie('token', newToken, {
            httpOnly: false
        });
        let redirectUrl
        redirectUrl = `${process.env.URL}/home`;

        const rolesToCheck = ["LocalOrganizer", "GlobalOrganizer","Judge","Jammer"];
        const hasAnyRole = rolesToCheck.some(role => roles.includes(role));

        if(!hasAnyRole){
            return res.clearCookie('token').redirect(`${process.env.URL}/login`);
        }
        return res.redirect(redirectUrl);
    } catch (error) {
        //console.error('Error processing token:', error);
        //res.status(400).json({ success: false, error: 'Error processing token' });
        return res.clearCookie('token').redirect(`${process.env.URL}/login/error`);
    }
};

const logOutUser = async (req, res) => {
    try {
        res.clearCookie('token').status(200).json({ success: true, message: 'Cookie deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error deleting cookie' });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const userId = req.cookies.token ? jwt.verify(req.cookies.token, 'MY_JWT_SECRET').userId : null;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User Not Found' });
        }
        
        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        return res.status(400).json({ success: false, error: 'Error processing token' });
    }
};

const getLocalOrganizersPerSite = async (req, res) => {
    const { siteId } = req.params;
    try {
        var organizers = await User.find({ "site._id": siteId, roles: 'LocalOrganizer' });
        return res.status(200).send({ success: true, msg: "Organizers found for site ", data: organizers });
    } catch (error) {
        return res.status(400).send({ success: false, msg: error.message });
    }
};

const updateSite = async (req, res) => {
    const { id } = req.params;
    const { siteId } = req.body;
    try {
        const user = await User.findByIdAndUpdate(id, { site: siteId }, { new: true });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const getStaffPerSite = async (req, res) => {
    const { siteId } = req.params;
    try {
        const staff = await User.find({ 
            "roles" : "LocalOrganizer",
            "site._id" : siteId
        })
        res.status(200).send({ success: true, msg: 'Staff have been found in the system.', data: staff });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

const getUsers = async (req, res) => {
    try {
        const allUsers = await User.find({});
        res.status(200).send({ success: true, msg: 'Users found in the system', data: allUsers });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

const getJammersPerSite = async (req, res) => {
    const { siteId, jamId } = req.params;
    try {
        const jammersOnSite = await UserOnJam.find({
            siteId: siteId,
            jamId: jamId
        });

        if(jammersOnSite.length == 0) return res.status(404).send({ success: false, message: 'No jammers found for this venue'});

        let jammerIds = new Array();
        jammersOnSite.forEach((jos) => {
            jammerIds.push(jos.userId);
        });

        let jammers = await User.find({
            _id: { "$in": jammerIds }
        });

        let jammerList = new Array();

        for(let j = 0; j < jammers.length; j++)
        {
            let jammer = jammers[j].toObject();
            const team = await Team.findOne({
                jamId: jamId,
                siteId: siteId,
                "jammers._id" : jammer._id
            });

            if(team)
            {
                jammer.team = {
                    _id : team._id,
                    name : team.teamName
                };
            }
            jammerList.push(jammer);
        }

        res.status(200).send({ success: true, message: 'Users with the role "Jammer" have been found in the system.', data: jammerList });
    } catch (error) {
        res.status(400).send({ success: false, message: error.message });
    }
};

const getJammersNotInTeamPerSite = async (req, res) => {
    const siteId = req.params.siteId;
    try {
        const jammersNotInTeam = await User.find({ "site._id": siteId, team: null, roles: 'Jammer' });
        res.status(200).send({ success: true, msg: 'Users with the role "Jammer" who are not in any team have been found in the system.', data: jammersNotInTeam });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        const deletedUser = await User.findOneAndDelete({ _id: id });
        const query = { 'jammers._id': id };

        const updateFieldsQuery = {
            $pull: {
                'jammers': { '_id': id }
            }
        };

        Team.updateMany(query, updateFieldsQuery)
            .then(result => {
                console.log("Jammer removed successfully:", result);
            })
            .catch(error => {
                console.error('Error removing Jammer:', error);
            });

        res.status(200).send({ success: true, message: 'User removed correctly', data: deletedUser });
    } catch (error) {
        res.status(400).send({ success: false, message: error.message });
    }
};

const registerUsersFromCSV = async (req, res) => {
    try {
        const { siteId , jamId } = req.params;
        const currentDate = new Date();

        const evaluatorId = req.cookies.token ? jwt.verify(req.cookies.token, 'MY_JWT_SECRET').userId : null;
        const creatorUser = await User.findById(evaluatorId);

        if (!creatorUser) {
            return res.status(401).json({ success: false, error: 'Invalid user' });
        }

        const site = await Site.findById(siteId);
        if(!site) return res.status(400).json({ success: false, message: 'Site is invalid' });

        const jam = await Jam.findById(jamId);
        if(!jam) return res.status(400).json({ success: false, message: 'Jam is invalid' });

        const jammerInfo = req.body.data;

        if(jammerInfo && jammerInfo.length > 0)
        {
            for(let j = 0; j < jammerInfo.length; ++j)
            {
                try{
                    // Check if the user exists, add it if not
                    let user = await User.findOne({
                        email: jammerInfo[j].email.toLowerCase().trim()
                    });

                    if(!user)
                    {
                        user = new User({
                            name: jammerInfo[j].name,
                            email: jammerInfo[j].email.toLowerCase().trim(),
                            discordUsername: jammerInfo[j].discordUsername,
                            instagram: jammerInfo[j].instagram,
                            linkedin: jammerInfo[j].linkedin,
                            telefoneWhatsApp: jammerInfo[j].telefoneWhatsApp,
                            ethnicity:jammerInfo[j].ethnicity,
                            gender: jammerInfo[j].gender,
                            intersex: jammerInfo[j].intersex,
                            identity: jammerInfo[j].identity,
                            orientation: jammerInfo[j].orientation,
                            disability: jammerInfo[j].disability,
                            participation: jammerInfo[j].participation,
                            student: jammerInfo[j].student,
                            school: jammerInfo[j].school,
                            roles: ['Jammer'],
                            creationDate: currentDate,
                            lastUpdateDate: currentDate
                        });
                        await user.save();
                    }

                    // Check if the user is already registered, register it if not
                    let userOnJam = await UserOnJam.findOne({
                        userId : user._id,
                        jamId : jamId
                    });

                    // If the user is already registered, stop processing this user
                    if(userOnJam)
                    {
                        jammerInfo[j].status = 'already registered';
                        jammerInfo[j].process = false;
                        continue;
                    }

                    if(!userOnJam)
                    {
                        userOnJam = new UserOnJam({
                            userId: user._id,
                            siteId: siteId,
                            jamId: jamId
                        });
                        await userOnJam.save();
                    }

                    // If the user has no team, stop processing this user
                    if(jammerInfo[j].teamName.toLowerCase().trim() == 'none')
                    {
                        jammerInfo[j].status = 'no team';
                        jammerInfo[j].proces = true;
                        continue;
                    }

                    // Check if this jammer is already on a team
                    let team = await Team.findOne({
                        jamId: jamId,
                        'jammers._id': user._id
                    });

                    // If the user already has a team, stop processing this user
                    if(team)
                    {
                        jammerInfo[j].status = 'already on a team';
                        jammerInfo[j].process = true;
                        continue;
                    }

                    if(!team)
                    {
                        // Check if the team exists, create it if not
                        team = await Team.findOne({
                            teamName : jammerInfo[j].teamName,
                            siteId: siteId,
                            jamId: jamId
                        });    
                    }
                    if(!team)
                    {
                        // Generate a unique code for this team (make sure it's a unique code)
                        let uniqueCode;
                        do
                        {
                            uniqueCode = crypto.randomBytes(10).toString('hex').slice(0,6).toUpperCase();
                            existingTeam = await Team.findOne({ teamCode: uniqueCode , jamId: jamId });
                        }
                        while(existingTeam);

                        team = new Team({
                            teamName: jammerInfo[j].teamName,
                            teamCode: uniqueCode,
                            siteId: siteId,
                            jamId: jamId,
                            creatorUser: {
                                userId: creatorUser._id,
                                name: creatorUser.name,
                                email: creatorUser.email
                            },
                            creationDate: currentDate,
                            lastUpdatedUser: {
                                userId: creatorUser._id,
                                name: creatorUser.name,
                                email: creatorUser.email
                            },
                            lastUpdateDate: currentDate
                        });
                        await team.save();
                    }

                    team.jammers.push({
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        discordUsername: user.discordUsername,
                        instagram: user.instagram,
                        linkedin: user.linkedin,
                        telefoneWhatsApp: user.telefoneWhatsApp,
                        ethnicity:user.ethnicity,
                        gender: user.gender,
                        intersex: user.intersex,
                        identity: user.identity,
                        orientation: user.orientation,
                        disability: user.disability,
                        participation: user.participation,
                        student: user.student,
                        school: user.school,
                        role: team.jammers.length == 0 ? 'owner' : ''
                    });

                    await team.save();

                    jammerInfo[j].status = "added successfully";
                    jammerInfo[j].process = true;
                } catch (error) {
                    jammerInfo[j].status = error.message;
                    jammerInfo[j].process = false;
                }
            }
        }
        return res.status(200).json({ success: true, message: 'User registration completed.', data: jammerInfo });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const addRol = async (req, res) => {
    const userId = req.params.id;
    const {rol} = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.roles.includes(rol)) {
            return res.status(400).json({ message: 'User already has role' });
        }
        user.roles.push(rol)
        await user.save();
        return res.status(200).json({ success: true, message: "Role added successfully" })
    }
    catch(error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

const deleteRol = async (req, res) => {
    const userId = req.params.id;
    const {rol} = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (!user.roles.includes(rol)) {
            return res.status(400).json({ message: `User doesn't have that role` });
        }
        user.roles = user.roles.filter(r => r !== rol);
            await user.save();
            return res.status(200).json({ success: true, message: "Rol removed successfully" })
    }
    catch(error){
        return res.status(400).json({ success: false, error: error.message });
    }
};

const saveJammerData = async (req, res) => {
    try{
        const { userId , siteId , jamId , data } = req.body;
        const currentDate = new Date();
        
        let uoj = await UserOnJam.findOne({
            userId: userId,
            siteId: siteId,
            jamId: jamId
        });
        if(!uoj)
        {
            return res.status(400).json({ success: false, message: 'No jammer found' });
        }
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Save jammer data
        //uoj.jammerData = JSON.stringify(data);
        uoj.jammerData.name = data.name;
        uoj.jammerData.countryOfOrigin = data.countryOfOrigin;
        uoj.jammerData.countryOfResidence = data.countryOfResidence;
        uoj.jammerData.city = data.city;
        uoj.jammerData.email = data.email;
        uoj.jammerData.discordUsername = data.discordUsername;
        uoj.jammerData.ethnicity = data.ethnicity;
        uoj.jammerData.gender = data.gender;
        uoj.jammerData.intersex = data.intersex;
        uoj.jammerData.orientation = data.orientation;
        uoj.jammerData.identity = data.identity;
        uoj.jammerData.disability = data.disability;
        uoj.jammerData.student = data.student;
        uoj.jammerData.school = data.school;
        uoj.jammerData.degree = data.degree;
        uoj.jammerData.studies = data.studies;
        uoj.jammerData.industry = data.industry;
        uoj.jammerData.participation = data.participation;
        uoj.jammerData.termsOfConduct = data.termsOfConduct;
        uoj.jammerData.termsOfImage = data.termsOfImage;
        uoj.jammerData.termsOfIP = data.termsOfIP;

        uoj = await uoj.save();

        //Save user data (for users that have account before the changes)
        user.name = data.name;
        user.email = data.email;
        user.discordUsername = data.discordUsername;
        user.ethnicity = data.ethnicity;
        user.gender = data.gender;
        user.intersex = data.intersex;
        user.orientation = data.orientation;
        user.identity = data.identity;
        user.disability = data.disability;
        user.participation = data.participation;
        user.student = data.student;
        user.school = data.school;
        user.lastUpdateDate = currentDate;
        
        user = await user.save();

        return res.status(200).json({ success: true, message: 'Jammer data saved successfully', data: uoj });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const validateUser = async (req) => {
    try{
        const userId = req.cookies.token ? jwt.verify(req.cookies.token, 'MY_JWT_SECRET').userId : null;
        const user = await User.findById(userId);
        return user;
    } catch (error) {
        return null;
    }
};

module.exports = {
    registerUser,
    updateUser,
    deleteUser,
    loginUser,
    getLoginLink,
    getCurrentUser,
    magicLink,
    logOutUser,
    updateSite,
    getLocalOrganizersPerSite,
    getUsers,
    getJammersPerSite,
    getJammersNotInTeamPerSite,
    getStaffPerSite,
    registerUsersFromCSV,
    addRol,
    deleteRol,
    validateUser,
    saveJammerData
};