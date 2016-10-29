var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var bCrypt = require('bcrypt-nodejs');

module.exports = function (passport) {

    passport.use('signup', new LocalStrategy({
        usernameField: 'email',
        passReqToCallback: true
    },
    function (req, username, password, done) {

        // find user in mongo
        console.log('validating sign up...');
        User.findOne({'username': username}, function (err, user) {
            console.log('findOne for signup routine completed. handling response from mongo');

            // In case of any error, return using the done method
            if (err) {
                console.log('Error in signup: ' + err);
                return done(err);
            }

            // already exists
            if (user) {
                console.log('User already exists with username: ' + username);
                return done(null, false, req.flash('message', 'User already exists'));

            } else if (password !== req.param('confirm-pass')) {
                console.log('Passwords do not match.');
                return done(null, false, req.flash('message', 'Passwords must match'));

            } else {
                // If there is no user with that email
                // create the user
                var newUser = new User();

                // set the user's local credentials
                newUser.username = username;
                newUser.password = createHash(password);

                // set the user's verification code
                newUser.email_verification.code = 

                // expiration 20 minutes from now
                var d = new Date();
                d.setMinutes(d.getMinutes() + 20);
                newUser.email_verification.expiration = d; 

                // Random code
                newUser.email_verification.code = generatePin();

                // save the user
                newUser.save(function(err) {
                    if (err) {
                        console.log('Error in saving user: ' + err);
                        throw err;
                    }
                    console.log('User registration successful');
                    return done(null, newUser, req.flash('message', 'Registration successful!'));
                });
            }
        });
    }));

    // Generates hash using bCrypt
    var createHash = function(password){
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    }

    // Generate a random 6 digit code
    var generatePin = function () {
        var pin = '';
        for (var i = 0; i < 6; i++) {
            var dig = Math.random() * 10;
            var rounded = Math.floor(dig)
            pin += rounded; 
        }
        return pin;
    }
}
