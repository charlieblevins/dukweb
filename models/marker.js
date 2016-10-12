var mongoose = require('mongoose');

var base_schema = {
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

var marker_schema = mongoose.Schema(base_schema);

// Add orig id field to deleted markers
base_schema.orig_id = { type: mongoose.Schema.Types.ObjectId };
var deleted_marker_schema = base_schema;

module.exports = {
    'Marker': mongoose.model('Marker', marker_schema),
    'DeletedMarker': mongoose.model('DeletedMarker', deleted_marker_schema),
}
