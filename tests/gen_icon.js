var request = require('request');
var fs = require('fs');

// Remove trail icons
del_if_exists('/Users/charlieblevins/Sites/duckmap.com/public/icons/trail.png');
del_if_exists('/Users/charlieblevins/Sites/duckmap.com/public/icons/trail@2x.png');
del_if_exists('/Users/charlieblevins/Sites/duckmap.com/public/icons/trail@3x.png');

// Remove hill icons
del_if_exists('/Users/charlieblevins/Sites/duckmap.com/public/icons/hill.png');
del_if_exists('/Users/charlieblevins/Sites/duckmap.com/public/icons/hill@2x.png');
del_if_exists('/Users/charlieblevins/Sites/duckmap.com/public/icons/hill@3x.png');

function del_if_exists(path) {

    try {
        fs.unlinkSync(path);
    } catch (e) {
        console.log(path + ' did not exist');
    }
}

['trail', 'mountain', 'lake', 'hill', 'creek'].forEach(function (noun) {

    request('http://localhost:3000/icon/' + noun + '@3x.png', function (err, res, body) {
        if (err) throw err;

        console.log('res 1: ' + res);
    });

});
