var user_models = require('../models/user');
var User = user_models.User;
var dukmail = require('../mail.js');


/**
 * Sends a help request from a user
 */
module.exports = function (req, res, next) {

    const email_info = {
        username: req.user.username,
        time_sent: new Date().toString(),
        message: req.body.message
    };

    // Send email
    dukmail.sendHelpRequest(req.user.username, email_info).done(() => {

        console.log('help request email sent.');
        req.flash('message', 'Your mesage has been sent. We will respond as soon as possible.');
        return res.redirect('/home');
    });
};
