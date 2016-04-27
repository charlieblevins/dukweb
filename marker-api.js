// Each function returns data to be 
// parsed to json and sent to requestor

var Marker = require('./models/marker.js'),
    _ = require("underscore"),
    fs = require('fs'),
    formidable = require('formidable'),
    crypto = require('crypto'),
    Q = require('q');

// Private functions

// This function uses formidable to
// parse multipart marker posts, ensure that
// they are unique and return their
// values if so.
// @returns Q promise object
function parse_marker_post (req, res) {
    var form,
        fields,
        file,
        image_hash,
        form_load;

	console.log('parse marker post');
    // Parse form data
    var form = new formidable.IncomingForm();
    form.uploadDir = __dirname + '/public/photos/';
    form.hash = 'md5';

    // Wait for load to finish
    form_load = Q.defer();

    // Parse all non-file form data then resolve
    form.parse(req, function (err, fields, files) {

        if (err) {
            form_load.reject(err);
            return;
        }

        form_load.resolve([fields, files, req, res]);
    });

    // Wait for hash creation AND form parse to finish
    return form_load.promise;
}

function validate_marker_post (fields, file, res) {

	console.log('validating photo');
	console.log(file);

    // Image file is required
    if (!file) {
        message = 'No image file detected. Image is required';
        console.log(message);
        res.status(422).json({message: message});
        return false;
    }

    // Coords are required
    if (!fields.latitude || !fields.longitude) {
        message = 'Coordinates missing or invalid.';
        console.log(message);
        res.status(422).json({message: message});
        return false;
    }

    // Tags required
    if (!fields.tags) {
        message = 'Tags missing or invalid.';
        console.log(message);
        res.status(422).json({message: message});
        return false;
    }

    // Valid
    return true;
}

function save_new_marker (data_array) {
    var fields = data_array[0],
        files = data_array[1],
        req = data_array[2],
        res = data_array[3],
        lat,
        lng,
        marker;

	console.log('save new marker');

    // New Marker instance
    marker = new Marker();

    // Validate marker data
    if (!validate_marker_post(fields, files.photo, res)) {

		console.log('validate marker post returned false');

        // Delete files
        files.forEach(function (file) {

			if (file && file.photo) {
				console.log('delete file: ' + file.photo.path);
				fs.unlink(file.photo.path);
			}

		});

        return false;
    }

	console.log('validation complete');

    // Format coords for geometry storage
    lat = parseFloat(fields.latitude);
    lng = parseFloat(fields.longitude);
    marker.geometry = {
        "type": "Point",
        "coordinates": [lng, lat]
    };

    // Tags, userid
    marker.tags = fields.tags;
    marker.user_id = req.user._id;

    // Rename files by hash
    for (var file in files) {
		console.log('renaming ' + file.name);
		console.log(file);
		console.log('\n');

		var new_name = file.photo.hash;

		// File names should be photo, photo_md, and photo_sm
		var size = file.name.replace('photo_');

		if (size) new_name = new_name + size;

		console.log('new name: ' + new_name);

		fs.rename(file.photo.path, __dirname + '/public/photos/' + new_name + '.jpg', function (err) {
			if (err) console.log('error renaming file: ' + err);
		});
	}

    marker.photo_file = file.photo.hash + '.jpg';
    marker.photo_hash = file.photo.hash;

    // save the marker 
    marker.save(function(err) {

        if (err) {
            console.log('Error in saving marker: ' + err);

            console.log('err code: ' + err.code);
            if (err.code === 16755) {
                return res.status(422).json({message: 'Latitude and longitude are not geographically valid.'});
            } else if (err.code === 11000) {
                return res.status(422).json({message: 'Image file already exists. Duplicate images are not allowed.'});
            } else {
                return res.status(500).json({message: 'An internal error occurred'});
            }
        }

        // Build return data
        returnData = marker.toObject();
        returnData = _.omit(returnData, 'user_id', '__v');

        res.status(201).json({ 
            message: 'New marker save successful',
            data: returnData
        });
    });
}

function handle_marker_data_failure () {
    console.log('marker data failure');
    return res.status(400).json({message: 'Error parsing form data. Please ensure form data is well formed.'});
}

// Api Methods
module.exports = {
    addMarker: function (req, res) {
        var marker = new Marker(),
            returnData,
            message,
            unique_img_hash;

        // Get form data and unique hash
        parse_marker_post(req, res).then(save_new_marker, handle_marker_data_failure);
        return;
    },

    getMarker: function (req, res) {
        console.log('Get marker id: ' + req.query.marker_id);

        Marker.findOne({'_id': req.query.marker_id}, function (err, marker) {
            if (err)
                return res.status(500).json({message: 'An internal error occurred'});

            if (!marker)
                return res.status(404).json({message: 'No marker was found with id ' + req.query.marker_id});

            // Make sure user is authorized to see/edit this marker
            if (!marker.user_id.equals(req.user._id)) {
                return res.status(403).json({message: 'You are not authorized to view this marker'});
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
                    return res.status(500).json({message: 'An internal error occurred'});
                }

                if (!marker)
                    return res.status(404).json({message: 'No marker was found with id ' + req.query.marker_id});

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
            res.status(422).json({message: 'No tags received. Only tags are editable'});
        }
    },

    deleteMarker: function (req, res) {
        // No id received 
        if (!req.query.marker_id) {
            res.status(422).json({message: 'No id received. Deletion is only possible with an id'});
        }

        console.log('find one');
        Marker.findOne({'_id': req.query.marker_id}, function (err, marker) { 
            if (err)
                return res.status(500).json({message: 'Internal server error'});

            if (!marker)
                return res.status(404).json({message: 'No marker was found with id ' + req.query.marker_id});

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
                    return res.status(500).json({message: 'Internal server error'});
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
                return res.status(404).json({message: 'No markers were found.'});

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
