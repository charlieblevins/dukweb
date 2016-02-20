var mongoose = require('mongoose');

module.exports = mongoose.model('Marker', {
    geometry: {
        "type": {
            "type": String,
            "enum": [
                "Point",
                "LineString",
                "Polygon"
            ]
        },
        "coordinates": {
            type: [Number],
            index: '2dsphere'
        }
    },
    tags: String,
    photo_file: String,
    photo_hash: {type: String, index: {unique: true, dropDups: true}},
    user_id: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    createdDate: { type: Date, default: Date.now } 
});
