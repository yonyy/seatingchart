'use strict';

var express = require('express');
var router = express.Router();
var mongoose = require('mongoose') //mongo connection
var Event = require('../model/event');

router.route('/')
	.get(function(req, res, next){
		Event.find({}, function (err, events){
			if (err) {
				console.error(err);
				res.status(500).send(err);
			}
			else {
				res.json(events);
			}
		});
	})

	.post(function(req, res) {
		console.log(req.body.event);
		Event.create(req.body.event, function (err, newEvent){
			if (err) res.status(500).send(err);
			else {
				console.log("Uploaded : " + newEvent.name);
				res.json(newEvent);
			}
		});
	});

router.route('/:id')
	.get(function(req, res, next){
		Event.findById(req.params.id, function (err, event){
			if (err) {
				console.error(err);
				res.status(500).send(err);
			}
			else {
				res.json(event);
			}
		});
	})

	.delete(function(req, res, next){
		Event.findById(req.params.id, function (err, event){
			if (err) {
				console.error(err);
				res.status(500).send(err);
			}
			else {
				event.remove(function (err, event){
					if (err) {
						console.error(err);
						res.status(500).send(err);
					}
					else {
						console.log('DELETE removing ID: ' + event._id);
						res.json(event);
					}
				});
			}
		});
	})

	.put(function(req, res, next){
		Event.findById(req.params.id, function (err, event){
			if (err) {
				console.log(err);
				res.status(500).send(err);
			}
			else {
				event.name = req.body.event.name
				event.save(function (err, r){
					console.log("Updated");
					res.json(r);
				});
			}
		});
	});

module.exports = router;