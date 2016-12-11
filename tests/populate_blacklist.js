var IconBlacklist = require('../models/icon_blacklist.js');
// Db configuration
dbConfig = require('../db.js'),
mongoose = require('mongoose');

var banned = [
    'shit',
    'bitch',
    'dick',
    'dik',
    'ass',
    'cunt',
    'prostitute',
    'whore',
    'jew',
    'penis',
    'vagina',
    'tits',
    'cock',
    'piss',
    'schlong',
    'fuck',
    'damn',
    'motherfucker',
    'turd'
];

banned = banned.map(function (noun) {
    var ban = new IconBlacklist();
    ban.noun = noun;
    return ban.toObject();
});

mongoose.connect(dbConfig.url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {

    console.log(banned);

    IconBlacklist.collection.insert(banned, function (err, docs) {
        if (err) return console.log('Insert err: ' + err);

        console.info('%d blacklist icons successfully inserted', docs.result.n);
        process.exit();
    });
});
