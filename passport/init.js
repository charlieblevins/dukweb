var login = require('./login');
var signup = require('./signup');
var basic = require('./basicAuth.js');
var user_models = require('../models/user');
var User = user_models.User;

module.exports = function (passport) {

    // Serialize and Deserialize to support persistent sessions
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    login(passport);
    signup(passport);
    basic(passport);
}
