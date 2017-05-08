module.exports = {
    //'url': 'mongodb://localhost/passport'
    'getURL': function () {
        var hosts = this.servers.join(',');
        return 'mongodb://' + hosts + '/dukdb';
    },
    'servers': [
        'db1.dukapp.io:27017',
        'db2.dukapp.io:27017',
        'arbiter1.dukapp.io:27017'
    ]
}
