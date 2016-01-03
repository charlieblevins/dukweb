var mongoose = require('mongoose');

module.exports = mongoose.model('Marker', {
    latitude: String,
    longitude: String,
    tags: String,
    createdDate: { type: Date, default: Date.now } 
});
