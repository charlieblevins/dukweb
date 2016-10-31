var User = require('../models/user');

module.exports = function (req, res, next) {

    console.log('checking verif code for user');
    if (!req.user) {
        res.status(200).render('index', {message: 'Apologies. Your session has expired. Please login again.'});
        console.log('no user logged in');
        return true;
    }

    // match entered code to existing
    var submitted_code = req.body.code;
    var code = String(req.user.email_verification.code);
    if (submitted_code !== code) {

        console.log('Wrong code entered: ' + submitted_code + '. Instead of ' + code);
        return res.render('/code-entry', {message: 'The entered code does not match our records.'});
    }

    // User and password both match, return user form done method
    // which will be treated like success
    console.log('verification successful');
    req.session.message = 'Email successfully verified.';
    return res.redirect('/home');
}
