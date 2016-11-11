var user_models = require('../models/user');
var User = user_models.User;
var dukmail = require('../mail.js');

module.exports = function (req, res, next) {

    console.log('checking verif code for user');
    if (!req.user) {
        res.status(200).render('index', {message: 'Apologies. Your session has expired. Please login again.'});
        console.log('no user logged in');
        return true;
    }

    // Save verification
    User.findOne({'username': req.user.username}, function (err, user) {

        // Replace code
        var code = dukmail.generatePin();
        user.email_verification.code = code;
        
        // expiration 30 minutes from now
        var d = new Date();
        d.setMinutes(d.getMinutes() + 30);
        user.email_verification.expiration = d; 

        // Not yet verified
        user.email_verification.verified = false;

        user.save((err) => {

            if (err) {
                console.log('Could not update code for user. Err: ', err);
                req.flash('message', 'A server error occurred. Please contact us if this persists.')
                return res.redirect('/code-entry');
            }

            // Send email
            dukmail.sendVerifCode(user.username, code).done(() => {

                console.log('Verif code email re-sent.');
                req.flash('message', 'Code re-sent. Please allow up to 15 minutes for delivery.')
                return res.redirect('/code-entry');
            });

        });
    });
}

// Code 1
// Failed to save user's verification flag as true
