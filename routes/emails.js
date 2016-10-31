'use strict';

var express = require('express');
var router = express.Router();
var env       = process.env.NODE_ENV || 'development';
var config = require(path.join(__dirname, '..', 'config', 'config.json'))[env];
var nodemailer = require('nodemailer');
var async = require('async')
var smtpPool = require('nodemailer-smtp-pool');


router.post('/', function(req, res, next) {
	var emails = req.body.emails;
	var status = false;
	var sent = 0;

	/* UCSD requires you to authorize SMTP with SSL (Secure Sockets Layer) to use 
		the outgoing mail server from off campus.
		For most non-UCSD ISPs, such as cable modem services, specify smtp.ucsd.edu 
		as your outgoing server. */
	var transporter = nodemailer.createTransport(smtpPool({
		host: 'smtp.ucsd.edu',
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

	emails.forEach(function(email) {
		var mailOptions = {
			from: 'Seating Charts <seatingcharts@ucsd.edu>', // sender address
			to: email.email, // list of receivers
			subject: email.subject, // Subject line
			text: email.text // plaintext body
		};
		
		// send mail with defined transport object
		transporter.sendMail(mailOptions, function(error, info){
			if(error) {
				status = false;
				console.log("Error sending to: " + email.email);
				console.log(error);
		    } else {
		    	sent++;
		        console.log('Message sent: ' + info.response);
		        console.log("sentTotal: " + sent + " out of " + emails.length);
		    }
		});
	});

	res.json({status: status, sent: sent});

});

module.exports = router;