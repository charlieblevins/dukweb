var mongoose = require('mongoose');

var base = {
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
}

var marker_schema = mongoose.Schema(base);

// Add orig id field to deleted markers
var deleted_marker = Object.assign({ orig_id: { type: mongoose.Schema.Types.ObjectId }}, base);
var deleted_marker_schema = mongoose.Schema(deleted_marker);

module.exports = {
    'Marker': mongoose.model('Marker', marker_schema),
    'DeletedMarker': mongoose.model('DeletedMarker', deleted_marker_schema),
}
