var mongoose = require('mongoose');

module.exports = mongoose.model('User', {
    username: String,
    password: String,
    createdDate: { type: Date, default: Date.now } 
});
