var user_models = require('../models/user');
var User = user_models.User;
var bCrypt = require('bcrypt-nodejs');

module.exports = function (req, res, next) {

    // Save verification
    User.findOne({'username': req.user.username}, function (err, user) {

        if (!req.body['new-password']) {
            var msg = 'Please type a password.';
            console.log(msg);
            return res.render('change-password', {new_password: msg});
        }

        if (!req.body['confirm-pass']) {
            var msg = 'Please re-type your password.';
            console.log(msg);
            return res.render('change-password', {confirm_pass: msg});
        }

        if (req.body['new-password'] !== req.body['confirm-pass']) {
            var msg = 'Passwords do not match.';
            console.log(msg);
            return res.render('change-password', {message: msg});
        }
        
        user.password = createHash(req.body['new-password']);

        console.log('Saving new password for ' + req.user.username);
        user.save((err) => {

            if (err) {
                console.log('Could not update password for user. Err: ', err);
                req.flash('message', 'A server error occurred. Please contact us if this persists.')
                return res.redirect('/code-entry');
            }

            var success = 'Password changed successfully.';
            console.log(success);
            req.flash('message', success);
            res.redirect('/home');
        });
    });
}

// Generates hash using bCrypt
var createHash = function(password){
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

// Code 1
// Failed to save user's verification flag as true
