var request = require('request');
var fs = require('fs');

// Remove trail icons
del_if_exists('/Users/charlieblevins/Sites/duckmap.com/public/icons/creek.png');
del_if_exists('/Users/charlieblevins/Sites/duckmap.com/public/icons/creek@2x.png');
del_if_exists('/Users/charlieblevins/Sites/duckmap.com/public/icons/creek@3x.png');

function del_if_exists(path) {

    try {
        fs.unlinkSync(path);
    } catch (e) {
        console.log(path + ' did not exist');
    }
}

var auth = "Basic " + new Buffer('blevins.charlie@gmail.com:eilrahC#*').toString('base64');

['creek'].forEach(function (noun) {

    request({
        url: 'http://localhost:3000/icon/' + noun + '@3x.png',
        headers: {"Authorization": auth}
    }, function (err, res, body) {
        if (err) throw err;

        console.log('res 1: ' + res);
    });

});
