// Each function returns data to be 
// parsed to json and sent to requestor

var models = require('./models/marker.js'),
    Marker = models.Marker,
    DeletedMarker = models.DeletedMarker,
    _ = require("underscore"),
    fs = require('fs'),
    formidable = require('formidable'),
    crypto = require('crypto'),
    Q = require('q'),
	mongoose = require('mongoose'),
	ObjectId = mongoose.Types.ObjectId;


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

    // log progress
    var percent = 0;
    form.on('progress', function (bytesReceived, bytesExpected) {
        var new_percent = Math.floor((bytesReceived / bytesExpected) * 100);
        if (new_percent > percent) {
            console.log(new_percent + '%');
            percent = new_percent;
        }
    });

    // Wait for hash creation AND form parse to finish
    return form_load.promise;
}

function validate_marker_post (fields, file, res) {

	console.log('validating photo');

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

	console.log('save new marker with fields');

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

    // Split tags on spaces
    marker.tags = fields.tags.split(' ');

    marker.user_id = req.user._id;

    marker.photo_hash = files.photo.hash;


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

		// Rename files by hash
		for (var file_name in files) {
			var file = files[file_name];

			// Use full size hash for all photos
			var new_name = marker.toObject()._id;

			// File names should be photo, photo_md, and photo_sm
			var size = file.name.replace('photo', '');

			if (size) new_name = new_name + size;

			console.log('Renaming ' + file.name + ' to ' + new_name);
			fs.rename(file.path, __dirname + '/public/photos/' + new_name + '.jpg', function (err) {
				if (err) console.log('error renaming file: ' + err);
			});
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

/**
 * Returns Q promise
 */
function get_marker_data (marker_id) {
    var def = Q.defer();

    Marker
        .aggregate([

            // Find marker by id
            { "$match" : {'_id': ObjectId(marker_id) } },

            // Join username from users collection
            { "$lookup" : { 
                "from" : "users",
                "localField" : "user_id",
                "foreignField" : "_id",
                "as" : "user_info" }
            },

            // Project (filter) only necessary fields
            { "$project" : {"createdDate" : 1, "tags" : 1, "photo_hash" : 1, "geometry" : 1, "user_info.username" : 1}}
        ])
        .exec(function (err, marker) {
            if (err)
                return def.reject({'message': 'An internal error occurred', 'status': 500});

            if (!marker || !marker[0])
                return def.reject({'status': 404, message: 'No marker was found with id ' + marker_id});

            // Build return data
            returnData = marker[0];

            // Make joined username field a property of main object
            if (returnData.user_info && returnData.user_info.length) {
                returnData.username = returnData.user_info[0].username;
            }

            delete returnData.user_info;

            def.resolve(returnData);
        });

    return def.promise;
}

/**
 * Get base 64 image data for a photo by it's id an size
 * @param size {string} - one of "full", "md", or "sm"
 */
function get_photo_b64 (marker_id, size) {
    var def = Q.defer(),
        size_suffix,
        b64_data;

    if (!marker_id) {
        console.log('marker_id is required for get_photo_b64');
        return def.reject({'status': 500, 'message': 'An internal error occurred'});
    }

    // If md or sm, use "_sm"/"_md" otherwise empty string
    size_suffix = (size === 'md' || size === 'sm') ? '_' + size : '';

    fs.readFile(appRoot + '/public/photos/' + marker_id + size_suffix + '.jpg', function (err, data_buffer) {
        if (err) {
            console.log(err);
            return def.reject({'status': 500, 'message': 'An internal error occurred'});
        }

        b64_data = data_buffer.toString('base64');
        def.resolve(b64_data);
    });

    return def.promise;
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
        var async_operations = [],
            returnData;

        console.log('Get marker id: ' + req.query.marker_id);

        // Get marker data
        async_operations.push(get_marker_data(req.query.marker_id));

        // Get image data (if requested)
        if (req.query.photo) {
            async_operations.push(get_photo_b64(req.query.marker_id, req.query.photo));
        }

        Q.all(async_operations)
            .spread(function (data, img_data) {

                returnData = data;

                console.log('Return data: ' + JSON.stringify(returnData, null, 4));

                // Insert img_data if returned
                if (img_data) {
                    returnData.photo = {
                        'data': img_data,
                        'size': req.query.photo
                    };
                    console.log('Including b64 img data: ' + img_data.substring(0, 20));
                }

                res.json({
                    message: 'found marker',
                    data: returnData
                });
                
            }).catch(function (reason) {
               res.status(reason.status).json({message: reason.message}); 
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

            if (err) {
                console.log(err);
                return res.status(500).json({message: 'Internal server error'});
            }

            if (!marker) {
                return res.status(404).json({message: 'No marker was found with id ' + req.query.marker_id});
            }

            // Make sure user is authorized to edit/delete this marker
            if (!marker.user_id.equals(req.user._id)) {
                return res.status(403).json({message: 'You are not authorized to view this marker'});
            }

            // Move photos to archive
            ['', '_md', '_sm'].forEach((suffix) => {

                const photo = marker._id.toString() + suffix + '.jpg';
                const existing_path = __dirname + '/public/photos/' + photo;
                const archive = __dirname + '/photo_archive/' + photo;

                fs.rename(existing_path, archive, function (err) {
                    if (err) console.log('error renaming file: ' + err);

                    console.log('archive of ' + photo + ' successful');
                });
            });

            // Add to deleted collection
            var delMarker = new DeletedMarker();

            delMarker.geometry = marker.geometry;
            delMarker.tags = marker.tags;
            delMarker.photo_hash = marker.photo_hash;
            delMarker.user_id = marker.user_id;
            delMarker.createdDate = marker.createdDate;
            delMarker.orig_id = marker._id;

            delMarker.save();

            // Delete from db
            marker.remove();

            res.status(200).json({message: 'marker with id: ' + req.query.marker_id + ' deleted successfully'});
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
        var query = Marker.find({
            geometry: {
                $geoWithin: {
                    $box: [
                        bottom_left,
                        upper_right
                    ]
                }
            }
        });

        // Paged result if page param exists
        if (req.query.page) {
            var res_per_page = 20;
            var page_index = parseInt(req.query.page) - 1;

            if (page_index >= 0) {
                query.skip(page_index * res_per_page);
            } else {
                console.log('invalid page value');
            }
        }

        query.limit(20);
        query.exec(function (err, markers) {

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
    },

    getMarkersNear: function (req, res) {

        if (!req.query.lat || !req.query.lng) {
            res.status(422).json({message: 'Missing parameters.'});
            return;
        }

        // Parse requested coords
        var lng = parseFloat(req.query.lng),
            lat = parseFloat(req.query.lat),
            point = { type: 'Point', coordinates: [lng, lat] };

        var opts = {
            spherical: true,
            limit: 30
        }

        // Filter by noun if passed
        if (req.query.noun) {

            console.log('Filter by noun');

            opts.query = { 
                'tags': {
                    $elemMatch: {
                        $eq: req.query.noun.trim()
                    }
                }
            }
        }

        Marker.geoNear(point, opts, function (err, data, stats) {
        
            // Handle results
            if (err)
                return res.status(500).json({message: myMongoErrs.get(err.code)});

            if (!data)
                return res.status(404).json({message: 'No markers were found.'});

            // Build return data (remove private data)
            returnData = data.map(function (marker) {
                var mo = marker.obj.toObject();

                // Return distance
                mo.distance = marker.dis;

                return _.omit(mo, 'user_id', '__v');
            });

            res.json({
                message: 'Markers found: ' + data.length,
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
