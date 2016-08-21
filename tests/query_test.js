// Db configuration
var dbConfig = require('../db.js');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

mongoose.connect(dbConfig.url);
var db = mongoose.connection;

var Marker = require('../models/marker.js');

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function () {
  console.log('connected to database');

  //nearNoTags();
  nearWithTags('mountain');
  //withTags('mountain');

});

function nearNoTags () {

  var lng = -84.379906;
  var lat = 33.946260;

  var point = { type: 'Point', coordinates: [lng, lat] };

  var opts = {
    maxDistance: 8046,
    spherical: true,
    limit: 30
  //query: { 'tags': 'mountain' }
  }

  // 8046 == 5 miles
  Marker.geoNear(point, opts, function (err, res, stats) {

    if (err) {
        console.log(err);
        process.exit();
    }

    console.log(res);
    console.log('Result count: ', res.length);
    console.log(stats);

    process.exit();
  });

}

function nearWithTags (tag) {

  var lng = -84.379906;
  var lat = 33.946260;

  var point = { type: 'Point', coordinates: [lng, lat] };

  var opts = {
    //maxDistance: 8046,
    spherical: true,
    limit: 30,
    query: { 
      'tags': {
        $elemMatch: {
          $eq: tag 
        }
      }
    }
  }

  // 8046 meters == 5 miles
  Marker.geoNear(point, opts, function (err, res, stats) {

    if (err) {
        console.log(err);
        process.exit();
    }

    console.log(typeof res[0].obj.tags);
    console.log('Result count: ', res.length);
    console.log(stats);
    console.log(JSON.stringify(res, null, 4));

    process.exit();
  });
}

function withTags (tag) {

  // 8046 meters == 5 miles
  Marker.find({ 'tags': tag }, function (err, res, stats) {

    if (err) {
        console.log(err);
        process.exit();
    }

    console.log(res);
    console.log('Result count: ', res.length);
    console.log(stats);

    process.exit();
  });
}
