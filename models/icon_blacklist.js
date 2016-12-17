var mongoose = require('mongoose');

var schema = mongoose.Schema({
    noun: {
        type: String,
        index: {
            unique: true,
            sparse: true,
            dropDups: true
        }
    },
    createdDate: { type: Date, default: Date.now } 
});

module.exports = mongoose.model('IconBlacklist', schema);
