var mongoose = require('mongoose');

module.exports = mongoose.model('Marker', {
    latitude: String,
    longitude: String,
    tags: String,
    photo_file: String,
    createdDate: { type: Date, default: Date.now } 
});
