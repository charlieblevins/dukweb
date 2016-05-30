/*
 * Generate or retrive marker icons when requested 
 */

var FS = require('q-io/fs');
var fs = require('fs');

var Q = require('q');

var NounProject = require('the-noun-project'),
    nounProject = new NounProject({
        key: '64b51b270edc449994250cee62d95ad9',
        secret: '61021a64c5b748d6ba02e6e22a143098'
    });

// PNG JS
var PNG = require('pngjs').PNG;

// Graphics magick / Image Magick
var gm = require('gm').subClass({imageMagick: true});

var request = require('request');

var requested_noun,
    requested_size;

module.exports = {

    // Get an icon either by generating it or from
    // cache.
    generate: function (req, res, next) {
        var icon_path;

        // Check if icon is already cached (generated)
        // and if so, return it
        req.icon_path = appRoot + '/public/icons/' + req.params.noun.toLowerCase();
        console.log('checking for icon in: ' + req.icon_path);

        FS.isFile(req.icon_path)
            .then(function (exists) {

                var def = Q.defer();
                
                // No file for this noun
                if (exists) {
                    next();
                    return;
                }

                // Get size setting (either '', '@2x', or '@3x')
                requested_size = req.params.noun.match(/@(.*[2,3]x)/gi);
                requested_size = (requested_size && requested_size.length) ? requested_size[0].toLowerCase() : '';

                // Get noun by removing size and .png extension. turtle@2x.png -> turtle
                requested_noun = req.params.noun.replace(/@(.*)|.png/gi, '');

                // Call to noun project and 
                // retrieve first result
                nounProject.getIconsByTerm(requested_noun, {limit: 1}, function (err, data) {

                    if (err) {
                        def.reject(err);
                        console.log('NounProject returned: ' + err); 
                        return;
                    }

                    console.log('Noun project returned data.');

                    def.resolve(data.icons[0]);
                });

                return def.promise;

            }).then(function (icon_data) {
                var def = Q.defer();

                // GET png from noun project
                console.log('GETting ' + icon_data.preview_url);

                request(icon_data.preview_url)

                .on('error', function (err) {
                    console.log(err);
                    def.reject(err);
                })
                
                .pipe(new PNG({filterType: 4}))
                
                .on('parsed', function() {

                    console.log('parsed PNG');

                    // Change color to white
                    convert_white(this);

                    // Write white file. Name "noun_white.png"
                    var white_img_path = appRoot + '/img_processing/interim/' + requested_noun + '_white.png';
                    var write_stream = fs.createWriteStream(white_img_path);
                    this.pack().pipe(write_stream);

                    write_stream.on('finish', function () {
                        def.resolve(white_img_path);
                    });
                });

                return def.promise;

            }).then(function (white_img_path) {

                return trim_transparent(white_img_path, requested_noun);

            }).then(function (trimmed) {
                
                // Add image over empty marker background
                var bg_img = appRoot + '/img_processing/icon_bgs/blue_bg.png';

                return composite(trimmed, bg_img, requested_noun)
                
            }).then(function (comp_file) {

                // Save 3 sizes for iphone
                return write_3_sizes(comp_file, requested_noun);

            // Let express next() move to send stage
            }).then(function () {
                console.log('3 images written');
                next();
            })

            .catch(function (err) {
                console.log(err);
            });
    },

    send: function (req, res) {

        console.log('Sending file: ' + req.icon_path);
        res.sendFile(req.icon_path, function (err) {

            if (err) {
                console.log(err);
                res.status(err.status).end();
                return;
            }

            console.log('Sent: ' + req.icon_path);

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

function trim_transparent (icon_img, noun) {
    var def = Q.defer(),
        trimmed = appRoot + '/img_processing/interim/' + noun + '_trimmed_150.png';

    console.log('Trimming transparent');
    gm(icon_img)
    .trim()
    .resize(150, 150)
    .write(trimmed, function (err) {
        if (err) {
            def.reject();
            throw err;
        }

        console.log("Trimmed image written");
        def.resolve(trimmed);
    });

    return def.promise;
}

/**
 * Run image magick composite to add icon over circle
 */
function composite (front_img_path, bg_img_path, noun) {
    var def = Q.defer(),
        comp_file = appRoot + '/img_processing/interim/' + noun + '_200.png';

    gm(bg_img_path)
    .composite(front_img_path)
    .gravity('Center')
    .write(comp_file, function (err) {
        if (err) {
            def.reject();
            throw err;
        }

        console.log("Composite image written");
        def.resolve(comp_file);
    });

    return def.promise;
}

/**
 * Write 3 sizes
 */
function write_3_sizes (full_img, new_name) {

    return Q.all([
        resize(full_img, [38, 38], new_name + '.png'),
        resize(full_img, [76, 76], new_name + '@2x.png'),
        resize(full_img, [114, 114], new_name + '@3x.png')
    ]);
}

/**
 * Resize with promise
 */
function resize (full_img, new_size, new_name) {
    var def = Q.defer();

    gm(full_img)
    .resize(new_size[0], new_size[1])
    .write(appRoot + '/public/icons/' + new_name, function (err) {
        if (err) {
            def.reject(err);
            throw err;
        }

        def.resolve();
    });

    return def.promise;
}
