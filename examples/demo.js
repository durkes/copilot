var copilot = require('../index');
var http = require('http');

var app = copilot();

/*Add middleware (optional)*/
// var cookieParser = require('cookie-parser');
// app.use(cookieParser());

// var bodyParser = require('body-parser');
// app.use('POST', bodyParser.urlencoded({extended: false}));
/*only call bodyParser on POST requests*/

/*Custom middleware*/
app.use(function (req, res, next) {
	console.log();
	console.log('req.route: ' + req.route);
	console.log('req.path: ' + req.path);
	console.log('req.query: ' + JSON.stringify(req.query));
	next();
});

/*Add custom routes*/
app.use('/hello', function (req, res, next) {
	res.end('Hi there!');
});
/*the above route will answer all requests to:
'/hello', '/hello.anything...', and '/hello/anything...'*/

app.use('/multi/handler', [function (req, res, next) {
	console.log('First handler');
	next();
}, function (req, res, next) {
	res.end('Success');
}]);
/*the above route has two handler functions defined in an array*/

app.use('GET', '/api/retrieve', function (req, res, next) {
	if (req.query.id === 'test') {
		/*respond only to /api/retrieve?id=test*/
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({id: 'test', result: 'success'}));
	}
	else {
		/*otherwise, continue to the next route*/
		next();
	}
});

app.use('GET', '/api/retrieve', function (req, res, next) {
	res.statusCode = 400;
	res.end('You must call this URL with the query string ?id=test');
	/*efficient coding would include this logic in the route above;
	this is just for demo*/
	/*notice next() was not called here in order to break the chain*/
});

app.use('/api/retrieve', function (req, res, next) {
	/*now catch all requests to '/api/retrieve' with methods other than GET
	(since GET requests would have been handled by one of the routes above)*/
	res.statusCode = 405;
	res.end('Must use GET method');
});

app.use('/cause/an/error', function (req, res, next) {
	next(new Error('This is an error message.'));
});

app.use('/error/multi/handler', [function (req, res, next) {
	console.log('First handler');
	next(new Error('Skip to the error handler.'));
}, function (req, res, next) {
	res.end('Success');
}]);

app.use(function (err, req, res, next) {
	/*catch errors from any route above*/
	/*notice the extra 'err' parameter in the function declaration*/
	res.statusCode = 500;
	res.end('Error: ' + err.message);
});

app.use('POST', function (req, res, next) {
	/*catch all POST-method requests*/
	var error = new Error('Method Not Allowed');
	error.status = 405;
	next(error);
});

app.use(function (req, res, next) {
	/*catch all requests that made it this far*/
	res.statusCode = 404;
	res.end('Custom Not Found');
});

app.use('*', '/', function (req, res, next) {
	/*this more verbose route definition is functionally identical to the one
	above; for demo purposes only*/
	res.statusCode = 404;
	res.end('Custom Not Found');
});

app.use(function (err, req, res, next) {
	/*catch errors from routes below the last error handler*/
	res.statusCode = err.status || 500;
	res.end('Error: ' + err.message);
});

/*launch the server*/
var server = http.createServer(app).listen(3000);