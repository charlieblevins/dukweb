var mail = require('../mail.js');

// temp setting env
global.appRoot = process.cwd();

mail.sendVerifCode('blevins.charlie@gmail.com', 123456).done(() => {
    console.log('verification send complete');
});
