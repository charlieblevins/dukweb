var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// Set project root
global.appRoot = path.resolve(__dirname);

var app = express();

// Configure locals
app.locals.moment = require('moment');

// Db configuration
var dbConfig = require('./db.js');
var mongoose = require('mongoose');

// Fix for promise depracation warning
mongoose.Promise = global.Promise;

mongoose.connect(dbConfig.getURL());
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function () {
  console.log('connected to database');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Configure passport and session
var passport = require('passport');
var session = require('express-session');
app.use(session({
    secret: 'bob the basset',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

var flash = require('connect-flash');
app.use(flash());

// Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);

// Allow index router to handle all incoming requests
var routes = require('./routes/index')(passport);
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	console.log(404);
	res.status(404);

	// respond with html page
	if (req.accepts('html')) {
		res.render('error', { url: req.url });
		return;
	}

	// respond with json
	if (req.accepts('json')) {
		res.send({ error: 'This resource does not exist.' });
		return;
	}

	// default to plain-text. send()
	res.type('txt').send('This resource does not exist.');
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    console.log('500 error: ', err);
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  console.log('500 error: ', err);
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
