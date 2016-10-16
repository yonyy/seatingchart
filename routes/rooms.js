'use strict';

var express = require('express');
var router = express.Router();
var mongoose = require('mongoose') //mongo connection


router.post('/', function(req, res, next) {
	mongoose.model('Room').findOne({name : req.body.room.name}, function (err, room){
		if (err) res.json(err);
		if (!newClass) {
			mongoose.model('Room').create(req.body.room, function (err, room){
				if (err) res.json(err);
				else res.json(room);
			});
		}
		else {
			console.log("Class already exists. Not uploading");
			res.json(room);
		}
	});

});

router.put('/:id', function(req, res, next) {
	mongoose.model('Room').findById(req.params.id, function(err, room) {
		if (err) {
			console.log(err);
			res.json(err);
		} else {
			/** TODO set new values */
			room.save(function(err, r) {
				console.log('updated');
				res.json(r);
			});
		}
	});
});

router.route('/')
	.get(function(req, res, next){
		mongoose.model('Room').find({}, function (err, rooms){
			if (err) {
				console.error(err);
				res.json(err);
			}
			else {
				res.json(rooms);
			}
		})
	});

router.route('/:id')
	.get(function(req, res, next){
		console.log("id: " + req.params.id)
		mongoose.model('Room').findById(req.params.id, function (err, room){
			if (err) {
				console.error(err);
				res.json(err);
			}
			else {
				res.json(room);
			}
		});
	})

	.delete(function(req, res, next){
		mongoose.model('Room').findById(req.params.id, function (err, room){
			if (err) {
				console.error(err);
				res.json(err);
			}
			else {
				room.remove(function (err, room){
					if (err) {
						console.error(err);
						res.json(err);
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
		mongoose.model('Room').find({classType: 'class'}, function (err, rooms){
			if (err) {
				console.error(err);
				res.json(err);
			}
			else {
				res.json(classrooms);
			}
		})
	});

router.route('/labs')
	.get(function(req, res, next){
		mongoose.model('Room').find({classType: 'lab'}, function (err, rooms){
			if (err) {
				console.error(err);
				res.json(err);
			}
			else {
				res.json(classrooms);
			}
		})
	});

module.exports = router;