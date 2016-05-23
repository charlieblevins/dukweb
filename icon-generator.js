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

// PNG JS
var PNG = require('pngjs').PNG;

// Graphics magick / Image Magick
var gm = require('gm').subClass({imageMagick: true});

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
                        def.reject(err);
                        throw err; 
                    }

                    def.resolve(data.icons[0]);
                });

                return def.promise;

            }).then(function (icon_data) {
                var def = Q.defer();

                // GET png from noun project
                request(icon_data.preview_url)

                .pipe(new PNG({filterType: 4}))
                
                .on('parsed', function() {

                    // Change color to white
                    convert_white(this);

                    // Write white file. Name "noun_white.png"
                    var write_stream = fs.createWriteStream(appRoot + '/img_processing/interim/' + req.query.noun + '_white.png');
                    this.pack().pipe(write_stream);

                    write_stream.on('finish', function () {
                        def.resolve();
                    });
                });

                return def.promise;

            }).then(function () {
                
                // Add image over empty marker background
                var front_img = appRoot + '/img_processing/interim/' + req.query.noun + '_white.png';
                var bg_img = appRoot + '/img_processing/icon_bgs/blue_bg.png';

                return composite(front_img, bg_img, req.query.noun)
                
            }).then(function (comp_file) {

                // Save 3 sizes for iphone
                return write_3_sizes(comp_file);

            // Let express next() move to send stage
            }).then(next);
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

/**
 * Run image magick composite to add icon over circle
 */
function composite (front_img_path, bg_img_path, noun) {
    var def = Q.defer(),
        comp_file = appRoot + '/img_processing/interim/' + noun + '_200.png';

    gm(bg_img_path)
    .composite(front_img_path)
    .geometry('+100+150')
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
function write_3_sizes (full_img) {

    return Q.all([
        resize(full_img, [38, 38], req.query.noun + '.png'),
        resize(full_img, [76, 76], req.query.noun + '@2x.png'),
        resize(full_img, [114, 114], req.query.noun + '@3x.png'),
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
