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
    }
    
};
