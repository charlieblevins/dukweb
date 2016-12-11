var mongoose = require('mongoose');

var schema = mongoose.Schema({
    attribution: String,
    iconPath: String,
    tag: String,
    createdDate: { type: Date, default: Date.now } 
});

module.exports = mongoose.model('Icon', schema);
