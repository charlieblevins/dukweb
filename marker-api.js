// Each function returns data to be 
// parsed to json and sent to requestor

var Marker = require('./models/marker.js');
var _ = require("underscore");

module.exports = {
    addMarker: function (req, res) {
        var marker = new Marker(),
            returnData,
            message;

        marker.latitude = req.body.latitude;
        marker.longitude = req.body.longitude;
        marker.tags = req.body.tags;
        marker.user_id = req.user._id;

        // Find user id
        console.log(req);

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
            returnData = marker;
            delete returnData.user_id;
            delete returnData.__v;

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
            console.log(returnData);

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

    },

    getMarkers: function (req, res) {

    }
}
