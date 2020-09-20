var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');
var handlebars = require('handlebars');
var fs = require('fs');
var Q = require('q');

var DukMail = function () {

    // Create transporter object (connection to mailgun)
    var auth = {
        auth: {
            // TODO - replace with env var
            api_key: '__KEY__',
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
            var err = 'Error: code required';
			console.log(err);
            def.reject(err);
			return def.promise;
        }

        // Define email content 
		var email_content = {
			'p1': 'Please enter the following code when signing in to your account:',
			'code': code,
			'sign-in-url': 'https://dukapp.io',
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
    };

     // Generate a random 6 digit code
    this.generatePin = function () {
        var pin = '';
        for (var i = 0; i < 6; i++) {
            var dig = Math.random() * 10;
            var rounded = Math.floor(dig)
            pin += rounded; 
        }
        return pin;
    };

    this.sendHelpRequest = function (email, info) {
        var def = Q.defer();
        
        const missing = missing_props(info, ['username', 'time_sent', 'message']);
        if (missing) {
            console.log('FAILURE: ' + missing);
            return false;
        }

        if (!email) {
            console.log('FAILURE: Email required');
            return false;
        }

        render_template(appRoot + '/views/help-request.txt', info).then((txt) => {

            var email_content = {
				from: {
					name: 'Duk User: ' + info.username,
					email: 'server@dukapp.io'
				},
				to_email: "blevins.charlie@gmail.com",
				subject: 'Help Request',
				message: {
					text: txt
				}
			};

            console.info(email_content);

			// Send the email
			this.send(email_content).done(() => {
				def.resolve();
			});
            
        });

        return def.promise;
    };

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

    // If properties are missing, get the info and log it.
    function missing_props(obj, props) {
        var missing;

        if (!obj) return "FAILURE: Config object is missing.";

        if (!props.length) return "FAILURE: No required properties were passed.";

        missing = props.filter((prop) => {
            if (obj[prop] === undefined) {
                return "Property: " + prop + " is required but missing";
            }
        });

        if (missing.length) {
            return missing.join("\n");
        }

        return false;
    }
}

module.exports = new DukMail();
