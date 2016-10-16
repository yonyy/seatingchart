var express = require('express');
var router = express.Router();
var mongoose = require('mongoose') //mongo connection
var bodyParser = require('body-parser'); // parses information from POST
var methodOverride = require('method-override'); // used to manipulate POST

router.use(bodyParser.urlencoded({ extended: true }))
router.use(methodOverride(function(req, res){
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
      }
}));

/************************
	Roster API
************************/
router.route('/rosters')
	.get(function(req, res, next){
		mongoose.model('Roster').find({}, function (err, rosters){
			if (err) {
				console.error(err)
				res.json(err)
			}
			else {
				res.json(rosters)
			}
		})
	});

router.route('/rosters/:id')
	.get(function(req, res, next){
		console.log("id: " + req.params.id)
		mongoose.model('Roster').findById(req.params.id, function (err, roster){
			if (err) {
				console.error(err)
				res.json(err)
			}
			else {
				res.json(roster)
			}
		});
	})

	.delete(function(req, res, next){
		mongoose.model('Roster').findById(req.params.id, function (err, roster){
			if (err) {
				console.error(err)
				res.json(err)
			}
			else {
				roster.remove(function (err, roster){
					if (err) {
						console.error(err)
						res.json(err)
					}
					else {
						console.log('DELETE removing ID: ' + roster._id);
						res.json(roster);
					}
				})
			}
		})
	})

	.put(function(req, res, next){
		mongoose.model('Roster').findById(req.params.id, function (err, roster){
			if (err) {
				console.log(err)
				res.json(err)
			}
			else {
				var newStudents = (req.body.students) ? req.body.students : roster.students
				console.log(newStudents)
				roster.students = newStudents
				roster.totalStudents = newStudents.length
				roster.rosterName = (req.body.title) ? req.body.title : roster.rosterName
				roster.save(function (err, r){
					console.log("Updated")
					console.log(r)
					res.json(r)
				})
			}
		})
	})


/************************
	Classroom & Labs API
************************/
router.route('/rooms')
	.get(function(req, res, next){
		mongoose.model('Classroom').find({}, function (err, classrooms){
			if (err) {
				console.error(err)
				res.json(err)
			}
			else {
				res.json(classrooms)
			}
		})
	});

router.route('/rooms/:id')
	.get(function(req, res, next){
		console.log("id: " + req.params.id)
		mongoose.model('Classroom').findById(req.params.id, function (err, classroom){
			if (err) {
				console.error(err)
				res.json(err)
			}
			else {
				res.json(classroom)
			}
		});
	})

	.delete(function(req, res, next){
		mongoose.model('Classroom').findById(req.params.id, function (err, classroom){
			if (err) {
				console.error(err)
				res.json(err)
			}
			else {
				classroom.remove(function (err, classroom){
					if (err) {
						console.error(err)
						res.json(err)
					}
					else {
						console.log('DELETE removing ID: ' + classroom._id);
						res.json(classroom);
					}
				})
			}
		})
	})

/************************
	Classroom API
************************/
router.route('/classrooms')
	.get(function(req, res, next){
		mongoose.model('Classroom').find({classType: 'classroom'}, function (err, classrooms){
			if (err) {
				console.error(err)
				res.json(err)
			}
			else {
				res.json(classrooms)
			}
		})
	});

router.route('/classrooms/:id')
	.get(function(req, res, next){
		console.log("id: " + req.params.id)
		mongoose.model('Classroom').findById(req.params.id, function (err, classroom){
			if (err) {
				console.error(err)
				res.json(err)
			}
			else {
				res.json(classroom)
			}
		});
	})

	.delete(function(req, res, next){
		mongoose.model('Classroom').findById(req.params.id, function (err, classroom){
			if (err) {
				console.error(err)
				res.json(err)
			}
			else {
				classroom.remove(function (err, classroom){
					if (err) {
						console.error(err)
						res.json(err)
					}
					else {
						console.log('DELETE removing ID: ' + classroom._id);
						res.json(classroom);
					}
				})
			}
		})
	});


/************************
	Lab API
************************/
router.route('/labs')
	.get(function(req, res, next){
		mongoose.model('Classroom').find({classType: 'lab'}, function (err, classrooms){
			if (err) {
				console.error(err)
				res.json(err)
			}
			else {
				res.json(classrooms)
			}
		})
	});

router.route('/labs/:id')
	.get(function(req, res, next){
		console.log("id: " + req.params.id)
		mongoose.model('Classroom').findById(req.params.id, function (err, classroom){
			if (err) {
				console.error(err)
				res.json(err)
			}
			else {
				res.json(classroom)
			}
		});
	})

	.delete(function(req, res, next){
		mongoose.model('Classroom').findById(req.params.id, function (err, classroom){
			if (err) {
				console.error(err)
				res.json(err)
			}
			else {
				classroom.remove(function (err, classroom){
					if (err) {
						console.error(err)
						res.json(err)
					}
					else {
						console.log('DELETE removing ID: ' + classroom._id);
						res.json(classroom);
					}
				})
			}
		})
	})

module.exports = router;