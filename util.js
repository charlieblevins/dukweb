module.exports = {
    getRoot: function () {
        return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    }
}
