var express = require('express');
var router = express.Router();
var marker_api = require('../marker-api.js');
var multer = require('multer');

// Configure photo uploads
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'photos/');
    },
    filename: function (req, file, cb) { 
        var fullName = req.body.latitude;
        fullName += '_' + req.body.longitude;
        fullName += '_' + Date.now() + '.jpg';
        cb(null, fullName);
    }
});
var upload = multer({ storage: storage });

var isAuthenticated = function (req, res, next) {
    console.log('isAuth: ' + req.isAuthenticated());
    if (req.isAuthenticated())
        return next();

    console.log('root redirect...');
    res.redirect('/');
}

module.exports = function (passport) {

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
    router.get('/home', isAuthenticated, function (req, res) {
        res.render('home', { user: req.user });
    });

    router.get('/signout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    /* ALL API Requests */
    router.post('/api/markers', upload.single('photo'), function (req, res) {
        marker_api.addMarker(req, res);
    });

    return router;    
}
