'use strict';

var express = require('express');
var router = express.Router();
var path = require('path');
var env       = process.env.NODE_ENV || 'development';
var config = require(path.join(__dirname, '..', 'config', 'config.json'))[env];
var nodemailer = require('nodemailer');
var async = require('async')
var smtpPool = require('nodemailer-smtp-pool');


router.post('/', function(req, res, next) {
	var email = req.body.email;

	/* UCSD requires you to authorize SMTP with SSL (Secure Sockets Layer) to use
		the outgoing mail server from off campus.
		For most non-UCSD ISPs, such as cable modem services, specify smtp.ucsd.edu
		as your outgoing server. */
	var transporter = nodemailer.createTransport(smtpPool({
		host: config.host,
		secure: true, // use SSL
		port : 465, // port for secure SMTP
		auth: {
			user: config.email,
			pass: config.pw
    	},
    	tls: {	//
    		rejectUnauthorized: false
    	}
	}));

	var mailOptions = {
		from: 'Seating Charts', // sender address
		to: email.email, // list of receivers
		subject: email.subject, // Subject line
		text: email.text // plaintext body
	};

	// send mail with defined transport object
	transporter.sendMail(mailOptions, function(error, info){
		if(error) {
			res.json(err);
			console.log("Error sending to: " + email.email);
			console.log(error);
	    } else {
			res.json({status: true});
	        console.log('Message sent: ' + info.response);
	        console.log("sentTotal: " + sent + " out of " + emails.length);
	    }
	});

});

module.exports = router;
