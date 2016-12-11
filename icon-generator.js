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
var IconData = require('./models/icon.js');
var IconBlacklist = require('./models/icon_blacklist.js');
var private_key = 'b185052862d41f43b2e3ffb06ed8b335';


module.exports = {

    // Get an icon either by generating it or from
    // cache.
    generate: function (req, res, next) {
        var icon_path,
            requested_noun,
            requested_size,
            icon_num,
            attribution;

        // Require private key
        if (req.query.key !== private_key) {
            console.log('private key not found');
            res.status(403); 
            return res.end();
        }

        if (!req.params.noun) {
            console.log('No noun passed with icon request');
            res.status(404); 
            return res.end();
        }

        // Get noun by removing size and .png extension. turtle@2x.png -> turtle
        requested_noun = req.params.noun.replace(/@(.*)|.png/gi, '');
        requested_noun = requested_noun.toLowerCase();

        // Check if icon is already cached (generated)
        // and if so, return it
        req.icon_path = appRoot + '/public/icons/' + req.params.noun.toLowerCase();
        console.log('checking for icon in: ' + req.icon_path);

        FS.isFile(req.icon_path)

            // Check cache and blacklist
            .then(function (file_exists) {

                var def = Q.defer();
                
                // File for this noun exists
                if (file_exists) {
                    def.reject('Returning icon from cache');
                    next();

                    // Return promise to prevent further execution 
                    return def.promise;
                }

                // Get size setting (either '', '@2x', or '@3x')
                requested_size = req.params.noun.match(/@(.*[2,3]x)/gi);
                requested_size = (requested_size && requested_size.length) ? requested_size[0].toLowerCase() : '';

                is_allowed(requested_noun).then(function (allowed) {
                    if (allowed === true) {
                        def.resolve();

                    } else if (allowed === false) {
                        def.reject('Icon found in blacklist');
                        req.icon_path = appRoot + '/public/icons/banned' + requested_size + '.png';

                        // Next middleware
                        next();
                    }
                });

                return def.promise;

            // Get from noun project
            }).then(function () {
                var def = Q.defer();

                // Allow query param to specify which icon 
                // is selected from noun project
                icon_num = parseInt(req.query.icon);

                // Limit to 20th result
                icon_num = (icon_num && icon_num < 21 && icon_num > 0) ? icon_num : 1;

                // Call to noun project and 
                // retrieve first result
                nounProject.getIconsByTerm(requested_noun, {limit: icon_num}, function (err, data) {

                    // NP returns 404 if no matching icons
                    if (err) {

                        console.log('Noun does not exist at NounProject. Returning default');

                        // Make symbolic link from this noun to default dot.png images
                        var default_icon_path = appRoot + '/public/icons/dot';
                        var sym_path = appRoot + '/public/icons/' + requested_noun;

                        Q.all([
                            FS.symbolicCopy(default_icon_path + '.png', sym_path + '.png'),
                            FS.symbolicCopy(default_icon_path + '@2x.png', sym_path + '@2x.png'),
                            FS.symbolicCopy(default_icon_path + '@3x.png', sym_path + '@3x.png')

                        // All finished
                        ]).then(function () {

                            req.icon_path = appRoot + '/public/icons/' + requested_noun + requested_size + '.png';

                            // Next middleware
                            next();

                            // Exit icon generation procedure
                            def.reject(err);
                            
                        });
                        return;
                    }

                    console.log('Noun project returned data.');

                    def.resolve(data.icons[icon_num - 1]);
                });

                return def.promise;

            }).then(function (icon_data) {
                var def = Q.defer();

                // Store attribution for illustrator credit page
                attribution = icon_data.attribution;

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

                // Get random color background
                var colors = ['blue', 'grass', 'green', 'purple', 'red'];
                var bg_color = colors[parseInt(Math.floor(Math.random() * colors.length))];
                
                // Add image over empty marker background
                var bg_img = appRoot + '/img_processing/icon_bgs/' + bg_color + '_bg.png';

                return composite(trimmed, bg_img, requested_noun)
                
            }).then(function (comp_file) {

                // Save 3 sizes for iphone
                return write_3_sizes(comp_file, requested_noun);

            // Save and continue
            }).then(function () {
                console.log('3 images written');

                // Save icon meta data
                save_icon_data(requested_noun, req.icon_path, attribution);

                // Let express next() move to send stage
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

    var new_file = appRoot + '/public/icons/' + new_name;

    gm(full_img)
    .resize(new_size[0], new_size[1])
    .write(new_file, function (err) {
        if (err) {
            def.reject(err);
            throw err;
        }

        console.log(new_file + ' write successful');

        def.resolve();
    });

    return def.promise;
}

function save_icon_data (noun, filepath, attribution) {
    console.log(noun, filepath, attribution);
    
    var icon = new IconData();

    icon.tag = noun;
    icon.iconPath = filepath;
    icon.attribution = attribution;

    icon.save((err) => {

        if (err) {
            console.log('Error saving icon: ', icon);
            return;
        }

        console.log('Icon saved successfully: ', icon);
    });
}

function lookup_icon (noun) {
    var def = Q.defer();
    
    IconData.findOne({'noun': noun}, function (err, icon) {
        if (err) {
            console.log(err);
            def.resolve(false);
        }

        if (!icon) {
            def.resolve(false);
        }

        def.resolve(icon);
    });

    return def;
}

function is_allowed (noun) {
    var def = Q.defer();
    
    IconBlacklist.findOne({'noun': noun}, function (err, icon) {
        if (err) {
            console.log(err);
            return def.reject(err);
        }

        // Icon not found - assume allowed
        if (!icon) {
            return def.resolve(true);
        }

        // Icon found in blacklist
        def.resolve(false);
    });

    return def.promise;
}
