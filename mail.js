var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');
var handlebars = require('handlebars');
var fs = require('fs');
var Q = require('q');

var DukMail = function () {

    // Create transporter object (connection to mailgun)
    var auth = {
        auth: {
            api_key: 'key-4febba6f076db49b2397c252d6a8dd34',
            domain: 'mail.dukapp.io'
        }
    };
    this.transporter = nodemailer.createTransport(mg(auth));

    /**
     * Send an email. config required
     */
    this.send = function (config) {
		var def = Q.defer();

		if (!config) {
			return dfail(def, 'config required for mail send');
		}

		if (!config.from) {
			return dfail(def, 'config.from required for mail send');
		}

		if (!config.to_email) {
			return dfail(def, 'config.to_email required for mail send');
		}

		if (!config.subject) {
			return dfail(def, 'config.subject required for mail send');
		}

		if (!config.message) {
			return dfail(def, 'config.message required for mail send');
		}

		var mailOptions = {
			from: '"' + config.from.name + '" <' + config.from.email + '>',
			to: config.to_email,
			subject: config.subject,
			text: config.message.text,
			html: config.message.html
		}

		this.transporter.sendMail(mailOptions, function (error, info) {
			if (error) return console.log(error);

			console.log('Email sent: ', info);
			def.resolve();
		});

		return def.promise;
    };

    /**
     * Send account verification code
     */
     this.sendVerifCode = function (email, code) {
		var def = Q.defer();

        if (!email) {
            var err = 'Error: email required';
			console.log(err);
            def.reject(err);
			return def.promise;
        }

        if (!code) {
            var err = 'Error: email required';
			console.log(err);
            def.reject(err);
			return def.promise;
        }

        // Define email content 
		var email_content = {
			'p1': 'Please enter the following code when signing in to your account:',
			'code': code,
			'sign-in-url': 'https://dukapp.io/sign-in',
			'sign-in-link-text': 'Back to Sign-In'
		};

		// Render html and txt
		var r1 = render_template(appRoot + '/views/code-email.html', email_content);
		var r2 = render_template(appRoot + '/views/code-email.txt', email_content);
		Q.all([r1, r2]).done((results) => {
			var html = results[0],
				txt = results[1];

			// Send the email
			this.send({
				from: {
					name: 'Duk Team',
					email: 'team@dukapp.io'
				},
				to_email: email,
				subject: 'Verification Code for Duk Account',
				message: {
					text: txt,
					html: html
				}

			}).done(() => {
				def.resolve();
			});
		});

		return def.promise;
     }

	function render_template (path, context) {
		var def = Q.defer();

        // Get html and plain text content
		fs.readFile(path, 'utf-8', (err, data) => {
			if (err) {
				console.log(err);
				def.reject(err);
				return def.promise;
			}

			var template = handlebars.compile(data);
			var rend_html = template(context);

			def.resolve(rend_html);
		});

		return def.promise;
	}

	// Generic fail for deferred functions
	// use like:
	// return dfail(def, "Something went wrong");
	function dfail (def, err) {
		console.log(err);
		def.reject(err);
		return def.promise;
	}
}

module.exports = new DukMail();
