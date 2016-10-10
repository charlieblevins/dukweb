var mongoose = require('mongoose');

var marker_schema = mongoose.Schema({
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
    tags: Array,

    // Must be unique, will drop duplicates, allow sparse (multiple null IS allowed)
    photo_hash: {type: String, index: {unique: true, dropDups: true, sparse: true}},
    user_id: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    createdDate: { type: Date, default: Date.now } 
});

module.exports = {
    'Marker': mongoose.model('Marker', marker_schema),
    'DeletedMarker': mongoose.model('DeletedMarker', marker_schema),
}
