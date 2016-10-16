var mongoose = require('mongoose');
var path = require('path');
var env = process.env.NODE_ENV || 'development';
var config = require(path.join(__dirname, '..', 'config', 'config.json'))[env];
/*var http = require('http');*/

// Here we find an appropriate database to connect to, defaulting to
// localhost if we don't find one.
var uristring =
process.env.UCSDSC ||	// mongolab connecting url
process.env.MONGOLAB_URI ||	// default monglab url  for the addon
process.env.MONGOHQ_URL ||
config.url
//'mongodb://localhost/csvDB'	// localhost database
//

// The http server will listen to an appropriate port, or default to
// port 5000.
/*var theport = process.env.PORT || 5000;*/

mongoose.connect(uristring, function (err, res) {
	if (err)
		console.log('ERROR connecting to: ' + uristring + '. ' + err)
	else
		console.log('Succeeded connected to: ' + uristring)
});