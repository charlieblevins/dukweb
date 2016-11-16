var user_models = require('../models/user');
var User = user_models.User;

module.exports = {
    
    /**
     * Validates a verification code and marks account as verified
     */
    validate_code: function (req, res, next) {

        console.log('checking verif code for user');
        if (!req.user) {
            res.status(200).render('index', {message: 'Apologies. Your session has expired. Please login again.'});
            console.log('no user logged in');
            return true;
        }

        // match entered code to existing
        var submitted_code = req.body.code;
        var code = String(req.user.email_verification.code);
        if (submitted_code !== code) {

            console.log('Wrong code entered: ' + submitted_code + '. Instead of ' + code);
            return res.render('code-entry', {message: 'The entered code does not match our records.'});
        }

        // Codes expire after 20 minutes
        var exp = req.user.email_verification.expiration;
        var now = new Date();
        if (exp < now) {
            console.log('Expired code entered. exp: ' + exp + '. Time is ' + now);
            return res.render('code-entry', {message: 'The entered code is expired. Please request a new one by clicking "Re-send Code" below.'});
        }

        // Save verification
        User.findOne({'username': req.user.username}, function (err, user) {

            // Set verified
            user.email_verification.verified = true;

            user.save((err) => {
                if (err) {
                    console.log('Could not save user\'s verification');
                    return res.render('/code-entry', {message: 'An internal error occurred. Code 1'});
                }

                console.log('verification successful');
                req.flash('message', 'Email successfully verified.')
                return res.redirect('/home');
            });
        });

    },

    /**
     * Get a user's verification status
     */
    is_verified: function (req, res, next) {

        if (!req.user) {
            res.status(200).render('index', {message: 'Apologies. Your session has expired. Please login again.'});
            console.log('no user logged in');
            return false;
        }

        if (!req.user.email_verification.verified) {
            console.log('Email not verified.');
            return false;
        }

        console.log('Email verified');
        return true;
    }
}

// Code 1
// Failed to save user's verification flag as true
