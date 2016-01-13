// Each function returns data to be 
// parsed to json and sent to requestor

var Marker = require('./models/marker.js');
var _ = require("underscore");
var fs = require('fs');

module.exports = {
    addMarker: function (req, res) {
        var marker = new Marker(),
            returnData,
            message;

        //marker.latitude = req.body.latitude;
        //marker.longitude = req.body.longitude;
        var lat = parseFloat(req.body.latitude);
        var lng = parseFloat(req.body.longitude);
        console.log(lat);
        marker.geometry = {
            "type": "Point",
            "coordinates": [lng, lat]
        };
        marker.tags = req.body.tags;
        marker.user_id = req.user._id;

        // Image file is required
        if (!req.file) {
            message = 'No image file detected. Image is required';
            console.log(message);
            return res.status(422).json({reason: message});
        }

        marker.photo_file = req.file.filename;

        // save the marker 
        marker.save(function(err) {
            if (err) {
                console.log('Error in saving marker: ' + err);
                return res.status(500).json({reason: 'An internal error occurred'});
            }

            console.log('Marker save successful');

            // Build return data
            returnData = marker.toObject();
            returnData = _.omit(returnData, 'user_id', '__v');

            res.status(201).json({ 
                message: 'New marker save successful',
                data: returnData
            });
        });

    },

    getMarker: function (req, res) {
        console.log('Get marker id: ' + req.query.marker_id);

        Marker.findOne({'_id': req.query.marker_id}, function (err, marker) {
            if (err)
                return res.status(500).json({reason: 'An internal error occurred'});

            if (!marker)
                return res.status(404).json({reason: 'No marker was found with id ' + req.query.marker_id});

            // Make sure user is authorized to see/edit this marker
            if (!marker.user_id.equals(req.user._id)) {
                return res.status(403).json({reason: 'You are not authorized to view this marker'});
            }

            // Build return data
            returnData = marker.toObject();
            returnData = _.omit(returnData, 'user_id', '__v');

            res.json({
                message: 'found marker',
                data: returnData
            });
        });
    },

    editMarker: function (req, res) {
        var tags = req.query.tags,
            marker_id = req.query.marker_id;

        // Only tags are editable for now
        if (tags) {

            // Update marker data
            Marker.findOne({'_id': marker_id}, function (err, marker) {
                if (err) {
                    console.log(err);
                    return res.status(500).json({reason: 'An internal error occurred'});
                }

                if (!marker)
                    return res.status(404).json({reason: 'No marker was found with id ' + req.query.marker_id});

                // Make sure user is authorized to see/edit this marker
                if (!marker.user_id.equals(req.user._id)) {
                    return res.status(403).json({message: 'You are not authorized to view this marker'});
                }

                // Update tags
                marker.tags = tags;
                marker.save(function (err) {
                    if (err) {
                        res.json({message: 'An internal error occurred'});
                    }

                    res.json({
                        message: marker._id + ' updated successfully',
                        new_tags: marker.tags
                    });
                });
            }); // end update

        } else {
            // No tags found
            res.status(422).json({reason: 'No tags received. Only tags are editable'});
        }
    },

    deleteMarker: function (req, res) {
        // No id received 
        if (!req.query.marker_id) {
            res.status(422).json({reason: 'No id received. Deletion is only possible with an id'});
        }

        console.log('find one');
        Marker.findOne({'_id': req.query.marker_id}, function (err, marker) { 
            if (err)
                return res.status(500).json({reason: 'Internal server error'});

            if (!marker)
                return res.status(404).json({reason: 'No marker was found with id ' + req.query.marker_id});

            // Make sure user is authorized to edit/delete this marker
            if (!marker.user_id.equals(req.user._id)) {
                return res.status(403).json({message: 'You are not authorized to view this marker'});
            }

            // Delete from db
            marker.remove();
            console.log('test');

            // Delete photo file
            fs.unlink(__dirname + '/public/photos/' + marker.photo_file, function (err) {
                if (err) {
                    console.log('error deleting ' + __dirname + '/../public/photos/' + marker.photo_file);
                    return res.status(500).json({reason: 'Internal server error'});
                }

                return res.status(200).json({message: 'Delete marker width id ' + marker._id + ' successful'});
            });
        });
    },

    getMarkersWithin: function (req, res) {

        // Parse requested coords
        var bottom_left = [
            parseFloat(req.query.bottom_left_lng),
            parseFloat(req.query.bottom_left_lat)
        ];

        var upper_right = [
            parseFloat(req.query.upper_right_lng),
            parseFloat(req.query.upper_right_lat)
        ];

        
        // Mongo query
        Marker.find({
            geometry: {
                $geoWithin: {
                    $box: [
                        bottom_left,
                        upper_right
                    ]
                }
            }
        }, function (err, markers) {

            // Handle results
            if (err)
                return res.status(500).json({message: myMongoErrs.get(err.code)});

            if (!markers)
                return res.status(404).json({reason: 'No markers were found.'});

            // Build return data (remove private data)
            returnData = markers.map(function (marker) {
                var mo = marker.toObject();
                return _.omit(mo, 'user_id', '__v');
            });

            res.json({
                message: 'Markers found: ' + markers.length,
                data: returnData
            });
        });
    }
}

var myMongoErrs = {

    get: function (num) {
        return myMongoErrs.errsByCode[String(num)];
    },

    errsByCode: {
        "17287": "There is a problem with your coordinates. Please make sure all four coordinates are valid floating point numbers"
    }
}
