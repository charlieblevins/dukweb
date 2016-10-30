var http = require('http');
var args = process.argv.slice(2);

// if -p passed, use dukapp.io
if (args[1] && args[1] === '-p') {
    var host = 'dukapp.io';
    var port = 80;
} else {
    var host = 'localhost';
    var port = 3000;
}

console.log('making request. host: ' + host + ' and port: ' + port);

http.request({
	host: host,
    port: port,
	path: '/api/markers?marker_id=' + args[0],
	method: 'DELETE',
	headers: {
		'Authorization': 'Basic ' + new Buffer('blevins.charlie@gmail.com:eilrahc38').toString('base64')
	}
}, function(response) {
	// Continuously update stream with data
	var body = '';
	response.on('data', function(d) {
        console.log('data received');
		body += d;
	});
	response.on('end', function() {
		console.log(body);
	});
    response.on('error', function (e) {
        console.log(e);
    });
})
.on('error', console.log)
.end();

