var Icon = require('../models/icon.js');

module.exports = {

    getNounList: function (req, res, next) {
        
        Icon.find({}, 'tag -_id', (err, icons) => {
            if (err) {
                res.status(500);
                console.log(err);
                return res.end();
            }

            console.log('getNounList found: ' + icons.length);
            req.iconNouns = icons.map((icon) => {
                return icon.tag;
            });
            next();
        });
    },

    getSingle: function (req, res, next) {

        Icon.findOne({'tag': req.params.noun}, '-_id', (err, icon) => {
            if (err) {
                res.status(500);
                console.log(err);
                return res.end();
            }

            if (!icon) {
                res.status(204);
                return res.end();
            }

            var ret = {
                'attribution': icon.attribution     
            };

            console.log('getSingle found: ' + icon);
            res.status(200);
            res.json(ret);
        });
    }
    
};
