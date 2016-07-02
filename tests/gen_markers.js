/*
 * Generate marker data and insert all into markers 
 */

var Marker = require('../models/marker.js'),

    Range = function (min, max) {
        this.min = min;
        this.max = max;

        // Difference between min/max
        this.delta = this.max - this.min;

        // Random within delta
        this.random = function () {

            // Add a random amount between delta to range minimum
            return parseFloat((this.min + (Math.random() * this.delta)).toFixed(6));
        };
    },
    // Db configuration
    dbConfig = require('../db.js'),
    mongoose = require('mongoose'),
	ObjectId = mongoose.Types.ObjectId;

var lat_range = new Range(33.718442, 34.053943);
var lng_range = new Range(-84.493572, -84.192727);

var Coord = function (lat, lng) {
    this.lat = lat;
    this.lng = lng;
}

var possible_tags = ['campsite', 'trail', 'creek', 'tree', 'hill', 'mountain', 'river'];

function rand_array_val (arr) {
    var ind = Math.round(Math.random() * (arr.length - 1));
    return arr[ind];
}

var marker_arr = [];
for (var i = 0; i < 500; i++) {

    var rand_lat = lat_range.random();
    var rand_lng = lng_range.random();

    var rand_coord = new Coord(rand_lat, rand_lng);

    var marker = {};

    marker.geometry = {
        "type": "Point",
        "coordinates": [rand_coord.lng, rand_coord.lat]
    };

    // Tags, userid
    marker.tags = rand_array_val(possible_tags);

    // Insert all as fake user for easy removal
    // User: cbradio@gmail.com
    marker.user_id = ObjectId("57692ef0d21e626a3f499470");

    // River photo?
    //marker.photo_hash = "577669835d3c16934000e0ee";

    marker_arr.push(marker);
}



mongoose.connect(dbConfig.url);
var db = mongoose.connection;


db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function () {
    console.log('db open');
    //db.markers.dropIndexes();

    // Bulk insert
    Marker.collection.insert(marker_arr, function (err, docs) {
        if (err) return console.log('Insert err: ' + err);

        console.info('%d markers successfully inserted', docs.result.n);
        process.exit();
    });

});
