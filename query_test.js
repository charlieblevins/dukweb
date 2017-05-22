
// Db configuration
var dbConfig = require('./db.js');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

mongoose.connect(dbConfig.url);
var db = mongoose.connection;

var Marker = require('./models/marker.js');

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function () {
  console.log('connected to database');

	Marker
	    .aggregate([

		// Find marker by id
		{ $match : {_id : ObjectId("5765c8200c07b25316e56a4c")}},

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
	    .exec(function (err, res) {
		console.log(err);
		console.log(res);
	    });
});

