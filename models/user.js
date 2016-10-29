var mongoose = require('mongoose');

var user_schema = mongoose.Schema({
    username: String,
    password: String,
    email_verification: {
        code: String,
        expiration: { type: Date }
    },
    createdDate: { type: Date, default: Date.now } 
});

module.exports = mongoose.model('User', user_schema);
