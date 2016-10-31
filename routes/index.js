var express = require('express');
var router = express.Router();
var marker_api = require('../marker-api.js');
var icon_generator = require('../icon-generator.js');
var is_code_valid = require('../passport/code-entry.js');


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

        }, function(req, res) {
            res.render('code-entry', {message: req.flash('message')});
        }
    );
    
    // Handle code entry POST 
    // must be logged in to access
    router.post('/code-entry', is_code_valid);

    /* GET Home Page */
    router.get('/home', basicOrLocalAuth, function (req, res) {
        var context = { user: req.user };

        if (req.session && req.session.message) {
            context.message = req.session.message;
            console.log('session messaged received');
        }
        res.render('home', context);
    });

    router.get('/signout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

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
