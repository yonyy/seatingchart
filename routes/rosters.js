'use strict';

var express = require('express');
var router = express.Router();
var mongoose = require('mongoose') //mongo connection
var Roster = require('../model/roster');

router.route('/')
	.get(function(req, res, next){
		Roster.find({}, function (err, rosters){
			if (err) {
				console.error(err);
				res.status(500).send(err);
			}
			else {
				res.json(rosters);
			}
		});
	})

	.post(function(req, res) {
		console.log(req.body.room);
		Roster.findOne({rosterName : req.body.roster.rosterName}, function (err, roster){
			if (err) res.status(500).send(err);
			if (!roster) {
				Roster.create(req.body.roster, function (err, roster){
					if (err) res.status(500).send(err);
					else {
						console.log("Uploaded : " + roster.rosterName);
						res.json(roster);
					}
				});
			}
			else {
				roster.students = req.body.roster.students;
				roster.totalStudents = req.body.roster.totalStudents;
				roster.name = req.body.roster.name;
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
		Roster.findById(req.params.id, function (err, roster){
			if (err) {
				console.error(err);
				res.status(500).send(err);
			}
			else {
				res.json(roster);
			}
		});
	})

	.delete(function(req, res, next){
		Roster.findById(req.params.id, function (err, roster){
			if (err) {
				console.error(err);
				res.status(500).send(err);
			}
			else {
				roster.remove(function (err, roster){
					if (err) {
						console.error(err);
						res.status(500).send(err);
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
		Roster.findById(req.params.id, function (err, roster){
			if (err) {
				console.log(err);
				res.status(500).send(err);
			}
			else {
				roster.students = req.body.roster.students;
				roster.totalStudents = req.body.roster.students.length;
				roster.name = req.body.roster.name;
				roster.save(function (err, r){
					console.log("Updated");
					res.json(r);
				});
			}
		});
	});

module.exports = router;