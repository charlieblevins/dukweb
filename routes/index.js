var express = require('express');
var router = express.Router();
var marker_api = require('../marker-api.js');
var icon_generator = require('../icon-generator.js');


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
    router.post('/login', passport.authenticate('login', {
        successRedirect: '/home',
        failureRedirect: '/',
        failureFlash: true
    }));

    /* GET Registration Page */
    router.get('/signup', function(req, res) {
        res.render('register', {message: req.flash('message')});
    });

    /* Handle REgistration POST */
    router.post('/signup', passport.authenticate('signup', {
        successRedirect: '/home',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    /* GET Home Page */
    router.get('/home', basicOrLocalAuth, function (req, res) {
        res.render('home', { user: req.user });
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


    // Icon Generator
    router.route('/icon/:noun')
        .get(icon_generator.generate, icon_generator.send);

    return router;    
}
