var IconBlacklist = require('../models/icon_blacklist.js');
var Icon = require('../models/icon.js');
var Q = require('q');
var fs = require('fs');
// Db configuration
dbConfig = require('../db.js'),
mongoose = require('mongoose');

var cli_nouns = process.argv.splice(2);


// connect db
mongoose.connect(dbConfig.url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function () {
    if (cli_nouns.length) {
        console.log('adding to BL: ' + cli_nouns);
        add_to_blacklist(cli_nouns).then(clean_icons);
    } else {
        clean_icons();
    }
});

function add_to_blacklist (nouns_arr) {
    var def = Q.defer(),
        banned;

    if (!nouns_arr || nouns_arr.length === 0) {
        return def.resolve();
    }

    banned = nouns_arr.map(function (noun) {
        return {noun: noun};
    });

    console.log(banned);

    IconBlacklist.collection.insert(banned, function (err, docs) {
        if (err) {
            if (err.code === 11000) {
                console.log('duplicate. Try again without duplicate');
                return def.resolve();
            } else {
                console.log('Insert err: ' + err);
                return def.reject();
            }
        }

        console.info('%d blacklist nouns successfully inserted', docs.result.n);
        def.resolve();
    });

    return def.promise;
}

/**
 * Remove blacklisted icons from icons collection
 */
function clean_icons () {
    // Get blacklisted nouns
    IconBlacklist.find({}, '-_id', {sort: {noun: 1}}, (err, banned) => {
        if (err) return console.log(err);

        var banned_nouns = banned.map((icon) => {
            return icon.noun;
        });

        console.log('BL nouns: ', banned_nouns);

        // Get existing icons matching blacklist
        Icon.find({tag: {'$in': banned_nouns}}, (err, data) => {
            if (err) return console.log(err);

            console.log('Found ' + data.length + ' banned icons.');
            
            // Remove
            if (data && data.length) {
                data.forEach((icon) => {
                    console.log('Removing icon for noun: ', icon.tag); 
                    console.log(icon);
                    Icon.remove({'_id': icon._id}, (err) => {
                        if (err) return console.log(err);
                    });
                });
            }
        });

        // Remove files
        banned_nouns.forEach(function (noun) {
            var dir = '../public/icons/';

            //exists
            fs.stat(dir + noun + '.png', (err, res) => {
                if (err) return;
                fs.unlinkSync(dir + noun + '.png');
                fs.unlinkSync(dir + noun + '@2x.png');
                fs.unlinkSync(dir + noun + '@3x.png');
                console.log('Removed icons: ', dir + noun);
            });
        });
    });
}
