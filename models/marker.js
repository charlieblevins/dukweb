var mongoose = require('mongoose');

module.exports = mongoose.model('Marker', {
    latitude: String,
    longitude: String,
    tags: String,
    photo_file: String,
    user_id: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    createdDate: { type: Date, default: Date.now } 
});
