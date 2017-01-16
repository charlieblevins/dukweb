var fs = require('fs');
var request = require('request');
var args = process.argv.slice(0, 2);

// if -p passed, use dukapp.io
if (args[0] && args[0] === '-p') {
    var host = 'dukapp.io';
    var port = 80;
} else {
    var host = 'localhost';
    var port = 3000;
}

console.log('making request. host: ' + host + ' and port: ' + port);

var host_port = 'http://' + host + ':' + port;
request.post(
    host_port + '/api/getMarkersById',
    {json: {
        markers: [
            {public_id: "585ea58e9f3912d4037a5e0f", photo_size: "sm"},
            {public_id: "585ea58e9f3912d4037a5e10", photo_size: ["sm", "md", "full"]}
        ]
    }},
    function(err, httpResponse, body) {
        console.log('RESPONSE');
        //console.log('httpResponse: ' + JSON.stringify(httpResponse));
        console.log('body: ' + JSON.stringify(body, function (key, val) {
            if (val.length > 100) return 'TOO LARGE';
            return val;
        }, 4));
    }
);
