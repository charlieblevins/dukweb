var restler = require('restler');
var fs = require('fs');
var file_stats = [];
file_stats.push(fs.statSync('test_photos/photo.jpg'));
file_stats.push(fs.statSync('test_photos/photo_md.jpg'));
file_stats.push(fs.statSync('test_photos/photo_sm.jpg'));

var args = process.argv.slice(2);

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
restler.post(host_port + '/api/markers', {
	multipart: true,
	username: 'blevins.charlie@gmail.com',
	password: 'eilrahc38',
	data: {
		'latitude': 33.956158,
		'longitude': -84.366538,
		'tags': 'test one two',
		'photo': restler.file('test_photos/photo.jpg', 'photo', file_stats[0].size, null, 'image/jpg'),
		'photo_md': restler.file('test_photos/photo_md.jpg', 'photo_md', file_stats[1].size, null, 'image/jpg'),
		'photo_sm': restler.file('test_photos/photo_sm.jpg', 'photo_sm', file_stats[2].size, null, 'image/jpg')
	}
}).on('complete', function(data) {
	console.log(data);
});
