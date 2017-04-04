'use strict';

var express = require('express');
var router = express.Router();
var mongoose = require('mongoose') //mongo connection
var Room = require('../model/room');

router.post('/', function(req, res, next) {
	console.log(req.body.room);
	Room.findOne({name : req.body.room.name}, function (err, room){
		if (err) res.status(500).send(err);
		if (!room) {
			Room.create(req.body.room, function (err, room){
				if (err) res.status(500).send(err);
				else {
					console.log("created room");
					res.json(room);
				}
			});
		}
		else {
			console.log("Class already exists. Not uploading");
			res.json(room);
		}
	});

});

router.put('/:id', function(req, res, next) {
	Room.findById(req.params.id, function(err, room) {
		if (err) {
			console.log(err);
			res.status(500).send(err);
		} else {
			/** TODO set new values */
			room.vmap = req.body.room.vmap;
			room.pmap = req.body.room.pmap;
			room.totalSeats = req.body.room.totalSeats;
			room.save(function(err, r) {
				if (err) {
					console.log(err);
					res.status(500).send(err);
				} else {
					console.log('updated room');
					res.json(r);
				}
			});
		}
	});
});

router.route('/')
	.get(function(req, res, next){
		Room.find({}, function (err, rooms){
			if (err) {
				console.error(err);
				res.status(500).send(err);
			}
			else {
				res.json(rooms);
			}
		})
	});

router.route('/:id')
	.get(function(req, res, next){
		Room.findById(req.params.id, function (err, room){
			if (err) {
				console.error(err);
				res.status(500).send(err);
			}
			else {
				res.json(room);
			}
		});
	})

	.delete(function(req, res, next){
		Room.findById(req.params.id, function (err, room){
			if (err) {
				console.error(err);
				res.status(500).send(err);
			}
			else {
				room.remove(function (err, room){
					if (err) {
						console.error(err);
						res.status(500).send(err);
					}
					else {
						console.log('DELETE removing ID: ' + room._id);
						res.json(room);
					}
				});
			}
		});
	});

router.route('/class')
	.get(function(req, res, next){
		Room.find({type: 'Class'}, function (err, rooms){
			if (err) {
				console.error(err);
				res.status(500).send(err);
			}
			else {
				res.json(classrooms);
			}
		})
	});

router.route('/labs')
	.get(function(req, res, next){
		Room.find({type: 'Lab'}, function (err, rooms){
			if (err) {
				console.error(err);
				res.status(500).send(err);
			}
			else {
				res.json(classrooms);
			}
		})
	});

module.exports = router;
