// Each function returns data to be 
// parsed to json and sent to requestor

var Marker = require('./models/marker.js');

module.exports = {
    addMarker: function (req, res) {
        var marker = new Marker();
        marker.latitude = req.body.latitude;
        marker.longitude = req.body.longitude;
        marker.tags = req.body.tags;
        marker.photo_file = req.file.filename;

        // save the marker 
        marker.save(function(err) {
            if (err) {
                console.log('Error in saving marker: ' + err);
                throw err;
            }

            console.log('Marker save successful');

            res.json({ 
                message: 'received post to /api/markers',
                data: marker
            });
        });

    },

    editMarker: function (req, res) {

    },

    deleteMarker: function (req, res) {

    },

    getMarkers: function (req, res) {

    }
}
