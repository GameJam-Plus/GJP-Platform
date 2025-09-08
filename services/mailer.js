const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const fs = require('fs');
const resend = new Resend(process.env.EMAILPASSWORD);

function get(obj, desc) {
    var arr = desc.split(".");
    while (arr.length && (obj = obj[arr.shift()]));
    return obj;
}

function replaceTokens(HTML, replacements) {
    return HTML.replace(/{{(.*?)}}/g, function(match, token) {
        var symbol = token.trim();
        return get(replacements, symbol);
    });
}

const sendEmail = async (email, subject, message, link) => {
    try {
        const htmlTemplate = await fs.promises.readFile('services/email_template.html', 'utf-8');
        const htmlContent = replaceTokens(htmlTemplate, { subject, message, link });

        const data = await resend.emails.send({
            from: process.env.EMAIL,
            to: email,
            subject: subject,
            html: htmlContent
        });

        
        console.log("Email sent successfully!\n", data);
    } catch (error) {
        console.log("Error sending the email: ", error);
    }
}

const sendScoree = async (email, subject, continuityPotential, audienceCompetitorAwarenessValue, marketPositioningValue, gameDesignCoreLoopValue, gameDesignHookValue, gameDesignBalanceValue, artVisualsCoherenceQualityValue, audioDesignCoherenceQualityValue, buildQualityValue, UIUXQualityValue, narrativeWorldBuildingValue, pitchFeedback, gameDesignFeedback, artVisualsFeedback, audioDesignFeedback, buildFeedback, personalFeedback) => {
    try {

        let transporter = nodemailer.createTransport({
            host: "smtp.office365.com",
            port: 587,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAILPASSWORD
            },
            secure: true
        });

        const htmlTemplate = await fs.promises.readFile('services/score_template.html', 'utf-8');

        const htmlContent = replaceTokens(htmlTemplate, {
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
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: subject,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully!");
    } catch (error) {
        console.log("Error sending email:", error);
    }
}

const sendScore = async (email, subject, score) => {
    try {

        let transporter = nodemailer.createTransport({
            host: "smtp.office365.com",
            port: 587,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAILPASSWORD
            },
            secure: true
        });

        const htmlTemplate = await fs.promises.readFile('services/score_template.html', 'utf-8');

        const htmlContent = replaceTokens(htmlTemplate, {
            score
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: subject,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully!");
    } catch (error) {
        console.log("Error sending email:", error);
    }
}

module.exports = { sendEmail, sendScore };