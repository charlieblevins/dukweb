var mongoose = require('mongoose');

var schema = mongoose.Schema({
    noun: String,
    createdDate: { type: Date, default: Date.now } 
});

module.exports = mongoose.model('IconBlacklist', schema);
