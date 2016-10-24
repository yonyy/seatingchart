'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var models = require("./model/db");

var room= require('./model/room');
var roster = require('./model/roster');
var event = require('./model/event');

app.use(express.static(__dirname + '/bower_components'));
app.use(express.static(__dirname + '/views'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var rooms = require('./routes/rooms');
var rosters = require('./routes/rosters');
var events = require('./routes/events');

app.use('/api/rooms/', rooms);
app.use('/api/rosters/', rosters);
app.use('/api/events/', events);

app.set('port', process.env.PORT || 3000);


var server = app.listen(app.get('port'), function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Server listening on http://%s:%s', host, port);
});

module.exports = app;