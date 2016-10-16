'use strict';

var express = require('express');
var router = express.Router();
var mongoose = require('mongoose') //mongo connection

router.route('/')
	.get(function(req, res, next){
		mongoose.model('Roster').find({}, function (err, rosters){
			if (err) {
				console.error(err);
				res.json(err);
			}
			else {
				res.json(rosters);
			}
		});
	})

	.post(function(req, res) {
		mongoose.model('Roster').findOne({rosterName : req.body.roster.rosterName}, function (err, newRoster){
			if (err) {
				res.json(err);
			}
			if (!newRoster) {
				mongoose.model('Roster').create(req.body.roster, function (err, newRoster){
					if (err)
						res.json(err);
					else {
						console.log("Uploaded : " + newRoster.rosterName);
						res.json(newRoster);
					}
				});
			}
			else {
				var newStudents = (req.body.students) ? req.body.students : roster.students;
				roster.students = req.body.roster.students;
				roster.totalStudents = req.body.roster.totalStudents;
				roster.rosterName = req.body.roster.rosterName;
				roster.save(function (err, r){
					console.log("Updated");
					res.json(r);
				});
			}
		});
	});

router.route('/:id')
	.get(function(req, res, next){
		console.log("id: " + req.params.id)
		mongoose.model('Roster').findById(req.params.id, function (err, roster){
			if (err) {
				console.error(err);
				res.json(err);
			}
			else {
				res.json(roster);
			}
		});
	})

	.delete(function(req, res, next){
		mongoose.model('Roster').findById(req.params.id, function (err, roster){
			if (err) {
				console.error(err);
				res.json(err);
			}
			else {
				roster.remove(function (err, roster){
					if (err) {
						console.error(err);
						res.json(err);
					}
					else {
						console.log('DELETE removing ID: ' + roster._id);
						res.json(roster);
					}
				});
			}
		});
	})

	.put(function(req, res, next){
		mongoose.model('Roster').findById(req.params.id, function (err, roster){
			if (err) {
				console.log(err);
				res.json(err);
			}
			else {
				var newStudents = (req.body.students) ? req.body.students : roster.students;
				roster.students = newStudents;
				roster.totalStudents = newStudents.length;
				roster.rosterName = (req.body.title) ? req.body.title : roster.rosterName;
				roster.save(function (err, r){
					console.log("Updated");
					res.json(r);
				});
			}
		});
	});

module.exports = router;