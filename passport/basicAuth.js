var BasicStrategy = require('passport-http').BasicStrategy;
var User = require('../models/user');
var bCrypt = require('bcrypt-nodejs');

module.exports = function (passport) {

    passport.use('basic', new BasicStrategy(function (username, password, done) {
        // check in mongo if a user with username exists or not
        User.findOne({'username': username}, function (err, user) {
            // In case of any  error, return using the done method
            if (err) 
                return done(err);
                
            // Username does not exist, log the error and redirect back
            if (!user) {
                console.log('User Not Found with username ' + username);
                return done(null, false);
            }

            // User exists but wrong password, log the error
            if (!isValidPassword(user, password)) {
                console.log('Invalid password');
                return done(null, false); // redirect back to login page
            }

            // User and password both match, return user form done method
            // which will be treated like success
            console.log('user login success: ' + user);
            return done(null, user);
        });
    }));

    var isValidPassword = function(user, password) {
        return bCrypt.compareSync(password, user.password);
    }
}
