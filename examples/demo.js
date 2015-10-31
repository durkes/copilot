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
	res.send('Hi there!');
});
/*the above route will answer all requests to:
'/hello', '/hello.anything...', and '/hello/anything...'*/

app.use('/multi/handler', [function (req, res, next) {
	console.log('First handler');
	next();
}, function (req, res, next) {
	res.send('Success');
}]);
/*the above route has two handler functions defined in an array*/

app.use('GET', '/api/retrieve', function (req, res, next) {
	if (req.query.id === 'test') {
		/*respond only to /api/retrieve?id=test*/
		res.send({id: 'test', result: 'success'});
	}
	else {
		/*otherwise, continue to the next route*/
		next();
	}
});

app.use('GET', '/api/retrieve', function (req, res, next) {
	res.send(400, 'You must call this URL with the query string ?id=test');
	/*efficient coding would include this logic in the route above;
	this is just for demo*/
	/*notice next() was not called here in order to break the chain*/
});

app.use('/api/retrieve', function (req, res, next) {
	/*now catch all requests to '/api/retrieve' with methods other than GET
	(since GET requests would have been handled by one of the routes above)*/
	res.send(405, 'Must use GET method');
});

app.use('/cause/an/error', function (req, res, next) {
	next(new Error('This is an error message.'));
});

app.use('/error/multi/handler', [function (req, res, next) {
	console.log('First handler');
	next(new Error('Skip to the error handler.'));
}, function (req, res, next) {
	res.send('This response will never occur.');
}]);

app.use(function (err, req, res, next) {
	/*catch errors from any route above*/
	/*notice the extra 'err' parameter in the function declaration*/
	res.send(err);
});

app.use('POST', function (req, res, next) {
	/*catch all POST-method requests*/
	var error = new Error('Method Not Allowed');
	error.status = 405;
	next(error);
});

app.use('/send/text', function (req, res, next) {
	res.send('Hello');
});

app.use('/send/json', function (req, res, next) {
	res.send({status: 200, response: 'OK'});
});

app.use('/send/array', function (req, res, next) {
	res.send([5, 4, 3, 2, 1, 'a', 'b', 'c']);
});

app.use('/send/status', function (req, res, next) {
	res.send(201);
});

app.use('/send/status+text', function (req, res, next) {
	res.send(201, 'Created');
});

app.use('/send/status+json', function (req, res, next) {
	res.send(201, {response: 'Created'});
});

app.use('/send/error', function (req, res, next) {
	var error = new Error('Test Error');
	error.status = 555;
	res.send(error);
	/*same as res.send(555, 'Error: Test Error');*/
});

app.use('/send/error2', function (req, res, next) {
	var error = new Error('Test Error');
	error.name = 'Not Allowed';
	error.status = 555;

	/*override error status code*/
	res.send(500, error);
	/*same as res.send(500, 'Not Allowed: Test Error');*/
});

app.use('/send/error3', function (req, res, next) {
	var error = new Error('Test Error');
	error.status = 555;

	/*remember that send(error) will NOT invoke the next error handler*/
	/*but next(error) will*/
	next(error);
});

app.use(function (req, res, next) {
	/*catch all requests that made it this far*/
	res.send(404, 'Custom Not Found');
});

app.use('*', '/', function (req, res, next) {
	/*this more verbose route definition is functionally identical to the one
	above; for demo purposes only*/
	res.statusCode = 404;
	res.end('Custom Not Found');
});

app.use(function (err, req, res, next) {
	/*catch errors from routes below the last error handler*/
	/*it is smart to log unexpected exceptions*/
	console.error(err)
	res.send(err);
});

/*launch the server*/
var server = http.createServer(app).listen(3000);