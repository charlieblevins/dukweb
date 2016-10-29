var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');

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

        if (!config) {
            console.log('config required for mail send');
            return false;
        }

        if (!config.from) {
            console.log('config.from required for mail send');
            return false;
        }

        if (!config.to_email) {
            console.log('config.to_email required for mail send');
            return false;
        }

        if (!config.subject) {
            console.log('config.subject required for mail send');
            return false;
        }

        if (!config.message) {
            console.log('config.message required for mail send');
            return false;
        }

        var mailOptions = {
            from: '"' + config.from.name + '" <' + config.from.email + '>',
            to: config.to_email,
            subject: config.subject,
            text: config.message.text,
            html: config.message.html
        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) return console.log(error);

            console.log('Email sent: ', info);
        });
    };

    /**
     * Send account verification code
     */
     this.sendVerifCode = function (email, code) {

        if (!email) {
            console.log('Error: email required');
            return false;
        }

        if (!code) {
            console.log('Error: email required');
            return false;
        }

        this.send({
            from: {
                name: 'Duk Team',
                email: 'team@dukapp.io'
            },
            to_email: email,
            subject: 'Verification Code for Duk Account'

        });
     }
}

