var express = require('express');
var router = express.Router();
var marker_api = require('../marker-api.js');
var icon_generator = require('../icon-generator.js');
var code_entry = require('../passport/code-entry.js');
var validate_code = code_entry.validate_code;
var is_verified = code_entry.is_verified;
var delete_account = require('../passport/delete-account.js');
var resend_code = require('../passport/resend-code.js');
var change_password = require('../passport/change-password.js');


var isAuthenticated = function (req, res, next) {
    console.log('isAuth: ' + req.isAuthenticated());
    if (req.isAuthenticated())
        return next();

    console.log('root redirect...');
    res.redirect('/');
}


module.exports = function (passport) {

    // Http basic auth handler
    var isBasicAuth = passport.authenticate('basic', { session : false });

    // If authorization header exists, use basic, else local auth
    var basicOrLocalAuth = function (req, res, next) {
        
        if (req.headers['authorization']) {
            return isBasicAuth(req, res, next);
        } else {
            return isAuthenticated(req, res, next);
        }
    };

    /* GET home page. */
    router.get('/', function(req, res, next) {
        res.render('index', { message: req.flash('message') });
    });

    /* Handle Login POST */
    router.post('/login',
        passport.authenticate('login', {
            failureRedirect: '/',
            failureFlash: true
        }),
        function (req, res) {
            // Email verify required to login
            if (req.user.email_verification.verified !== true) {
                return res.redirect('/code-entry');
            }

            // logged in and verified
            res.redirect('/home');
        }
    );

    // GET Registration Page
    // form submits to /signup
    router.get('/signup', function(req, res) {
        res.render('register', {message: req.flash('message')});
    });

    /* Handle Registration POST */
    router.post('/signup', passport.authenticate('signup', {
        successRedirect: '/code-entry',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    // Code entry page. Must be logged in
    router.get('/code-entry',

        // Ensure auth
        function (req, res, next) {
            if (req.isAuthenticated()) return next();

            console.log('Tried to access code-entry without auth. Redirect to /login');
            return res.redirect('/');

        }, 

        // Render code entry page
        function(req, res) {
            // Don't allow if code already verified
            if (!is_verified(req, res)) {
                res.render('code-entry', {message: req.flash('message')});
            } else {
                res.redirect('/home');
            }
        }
    );
    
    // Handle code entry POST 
    // must be logged in to access
    router.post('/code-entry', validate_code);

    // User requested another verification code
    router.post('/resend-code', resend_code);

    /* GET Home Page */
    router.get('/home', basicOrLocalAuth, function (req, res) {
        if (!is_verified(req, res)) {
            return res.redirect('/code-entry');
        }

        var context = { user: req.user };
        context.message = req.flash('message');

        res.render('home', context);
    });

    router.get('/change-password', basicOrLocalAuth, function(req, res) {
        res.render('change-password');
    });
    router.post('/change-password', basicOrLocalAuth, change_password);

    router.get('/delete-account', basicOrLocalAuth, function(req, res) {
        res.render('delete-account');
    });

    router.get('/signout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    router.post('/delete-account', delete_account);


    /** 
     * API 
     **/

    // Auth Check API (Check if username/password are valid)
    router.route('/api/authCheck')
        .get(isBasicAuth, function (req, res) {
            res.status(200).json({
                message: 'Login credentials valid'
            });
        }); 
    
    // Marker Api Requests
    router.route('/api/markers')
        .post(isBasicAuth, marker_api.addMarker);

    router.route('/api/markers/')
        .get(marker_api.getMarker)
        .put(isBasicAuth, marker_api.editMarker)
        .delete(isBasicAuth, marker_api.deleteMarker)

    // No auth required to get markers within a polygon
    router.route('/api/markersWithin/')
        .get(marker_api.getMarkersWithin);

    // No auth required to get markers near a point 
    router.route('/api/markersNear/')
        .get(marker_api.getMarkersNear);


    // Icon Generator
    router.route('/icon/:noun')
        .get(icon_generator.generate, icon_generator.send);

    return router;    
}
