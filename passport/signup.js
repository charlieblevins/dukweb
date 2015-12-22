var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var bCrypt = require('bcrypt-nodejs');

module.exports = function (passport) {

    passport.use('signup', new LocalStrategy({
        passReqToCallback: true
    },
    function (req, username, password, done) {

        findOrCreateUser = function () {
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
                } else {
                    // If there is no user with that email
                    // create the user
                    var newUser = new User();

                    // set the user's local credentials
                    newUser.username = username;
                    newUser.password = createHash(password);
                    newUser.email = req.param('email');
                    newUser.firstName = req.param('firstName');
                    newUser.lastName = req.param('lastName');

                    // save the user
                    newUser.save(function(err) {
                        if (err) {
                            console.log('Error in saving user: ' + err);
                            throw err;
                        }
                        console.log('User registration successful');
                        return done(null, newUser);
                    });
                }
            });
        };

        // Execute in next tick of event loop
        process.nextTick(findOrCreateUser);
    }));

    // Generates hash using bCrypt
    var createHash = function(password){
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    }
}
