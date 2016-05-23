/*
 * Generate or retrive marker icons when requested 
 */

var FS = require('q-io');

var Q = requrie('q');

var NounProject = require('the-noun-project'),
    nounProject = new NounProject({
        key: '64b51b270edc449994250cee62d95ad9',
        secret: '61021a64c5b748d6ba02e6e22a143098'
    });

var spawn = require('child-process').spawn;
var PNG = require('pngjs').PNG;

module.exports = {

    // Get an icon either by generating it or from
    // cache.
    generate: function (req, res) {
        var icon_path;

        // Check if icon is already cached (generated)
        // and if so, return it
        req.icon_path = appRoot + '/public/icons/' + req.query.noun + '.png';

        fs.stat(req.icon_path);
            .then(function (stats) {

                var def = Q.defer();
                
                // No file for this noun
                if (stats.isFile()) {
                    next();
                    return;
                }


                // Call to noun project and 
                // retrieve first result
                nounProject.getIconsByTerm(req.query.noun, {limit: 1}, function (err, data) {

                    if (err) {
                        throw new Error('Error communicating with noun project'); 
                    }

                    def.resolve(data.icons[0]);

                });

                return def.promise;

            }).then(function (icon_data) {


                // GET png from noun project
                request(icon_data.preview_url)

                .pipe(new PNG({
                    filterType: 4
                }))

                .on('parsed', function() {

                    // Change color to white
                    convert_white(this);

                    this.pack().pipe(fs.createWriteStream('out.png'));
                });


                // Add image over empty marker background


                // Save 3 sizes for iphone


                // Send icon as response

                
            });

    },

    send: function (req, res) {

        res.sendFile(filePath, function (err) {

            if (err) {
                console.log(err);
                res.status(err.status).end();
                return;
            }

            console.log('Sent: ' + filePath);

        });

    }

}

// Private

/**
 * Convert to white
 */
function convert_white (png_obj) {

    for (var y = 0; y < png_obj.height; y++) {
        for (var x = 0; x < png_obj.width; x++) {
            var idx = (png_obj.width * y + x) << 2;

            // invert color
            png_obj.data[idx] = 255;
            png_obj.data[idx+1] = 255;
            png_obj.data[idx+2] = 255;

            var red = png_obj.data[idx];
            var green = png_obj.data[idx + 1];
            var blue = png_obj.data[idx + 2];
            var opacity = png_obj.data[idx + 3];
            console.log(red + ', ' + green + ', ' + blue + ', ' + opacity);

            // and reduce opacity
            //png_obj.data[idx+3] = png_obj.data[idx+3] >> 1;
        }
    }

    return png_obj;
}
