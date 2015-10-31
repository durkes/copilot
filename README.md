# Copilot - Node.js middleware router

Copilot is a lighter, faster [Node](http://nodejs.org/) router inspired by [Express](https://www.npmjs.com/package/express), [Restify](https://www.npmjs.com/package/restify), and [Connect](https://www.npmjs.com/package/connect). It was born out of a need for something in between. Much of the baseline code was derived from [Connect](https://www.npmjs.com/package/connect).

The purpose of Copilot is to provide key conveniences for developing a Node server with the option to add middleware for additional functionality when you need it. Built-in features are limited by design. The configuration is flexible and unopinionated, keeping you first-in-command.

### Table of Contents
 * [How to use Copilot](#how-to-use-copilot)
 * [Routing](#routing)
 * [Request properties](#request-properties)
 * [Responding to requests](#responding-to-requests)
 * [Error handling](#error-handling)
 * [A thorough example](#a-thorough-example)
 * [Middleware](#middleware)
 * [Fair warning](#fair-warning)
 * [How Copilot is different](#how-copilot-is-different)

## How to use Copilot

#### Installation
```bash
$ npm install copilot
```

#### Setting up your server
```js
var copilot = require('copilot');
var http = require('http');

var app = copilot();
app.use('POST', '/hello', routeHandler);	// handle POST requests to /hello
app.use('/hello', routeHandler);			// handle any request to /hello
app.use('PUT', routeHandler);				// handle all PUT requests (to any URL)
app.use(routeHandler);						// catch-all route
app.use(errorHandler);						// catch errors from any route above

var server = http.createServer(app).listen(3000);	// launch the server


/*Example handler functions*/
function routeHandler(req, res, next) {
	if (true) res.send('Hi there!');		// respond to request if condition true
	else next();							// otherwise, call next matching route
}

function errorHandler(err, req, res, next) {
	res.send(err);          				// responded, so do not call next()
}
```

## Routing
Routing in Copilot works by matching the requested URL path and HTTP method.
```js
app.use(METHOD, PATH, HANDLER);
```
Every route **must** contain a route handler function, but method and path are optional.
 - If no method is defined, or the method is defined as `'*'`, the route will match any method
 - If no path is defined, or the path is defined as `'/'`, the route will match any path

Method and path matching are **case insensitive**, and paths only need to match the prefix as long as the breakpoint character is a `/` or `.`. Furthermore, a trailing slash (`/`) in the route definition path has no effect.

#### Example
Consider the following route definitions (they are functionally identical):
```js
app.use('/test', function (req, res, next) { ... });
app.use('/TEST', function (req, res, next) { ... });
app.use('/test/', function (req, res, next) { ... });
app.use('*', '/test', function (req, res, next) { ... });
```
Requests to these URLs would **match** the routes above:
 - http://www.example.com/test
 - http://www.example.com/TEST
 - http://www.example.com/test/
 - http://www.example.com/test.
 - http://www.example.com/test/anything...
 - http://www.example.com/test.anything...
 - http://www.example.com/test?query=string

But requests to these URLs would **not match**:
 - ~~http://www.example.com/tes~~
 - ~~http://www.example.com/test1~~
 - ~~http://www.example.com/another/test~~

#### Route chaining
**Order is important.**
Since routing allows for prefix matching, it might be important to define routes for nested paths first, depending on your intention.

```js
app.use('/test/one', function (req, res, next) { ... });
app.use('/test', function (req, res, next) { ... });
```

In this example, requests to `http://www.example.com/test/one` will be handled by the first route, while requests to `http://www.example.com/test/two` will be handled by the second route.

If the route definitions were in reverse order, requests to `http://www.example.com/test/one` would be handled by the `/test` route first.

#### Multiple handlers
For readability, multiple handlers can be registered on a route by placing them in an array.

```js
app.use('/multiple', [function one(req, res, next) { ... }, function two(req, res, next) { ... }]);
```

This is functionally identical to:
```js
app.use('/multiple', function one(req, res, next) { ... });
app.use('/multiple', function two(req, res, next) { ... });
```

#### next()
Within your route handler functions, you must either respond to requests using `res.send()` or `res.end()`, or call `next()` to invoke the next matching route handler. This enables you to create a waterfall effect.

Consider the following two catch-all routes:
```js
app.use(function (req, res, next) {
	var hour = new Date().getHours();
	if (hour === 0) {
		res.send('Down for maintenance');
	}
	else {
		next();
	}
});

app.use(function (req, res, next) {
	res.send('Hello!');
});
```
In this example, the first route will respond with "Down for maintenance" during the midnight hour. During other hours it will resolve to `next()` and invoke the second route to respond with "Hello!"

You should not call `next()` more than once from within a route handler.

## Request properties
Copilot appends a few properties to the `req` object, including query string data.

Consider the following route definition:
```js
app.use('/api', routeHandler);
```
For requests to `http://www.example.com/API/retrieve?name=John%20Doe&state=MO`, the `req` object will contain the following properties and values:
```js
function routeHandler(req, res, next) {
	req.route === '/api' 			// matches your route definition
	req.path === '/API/retrieve'	// matches the current URL path
	req.query.name === 'John Doe'
	req.query.state === 'MO'
}
```

## Responding to requests
Copilot includes a `send` method to conveniently handle common response patterns. You can use `res.send()` anywhere you would normally use `res.end()` to send a text response, but with added functionality to send an object and change the response status code.

Call `res.send()` __once per request__ from within a route handler.
```js
/*Examples*/
res.send('Simple text response');
res.send(404, 'Not Found');
res.send(500); // No response body; status code only

var json = {version: '1.0', code: 200, message: 'Success'};
res.send(json);

var error = new Error('Not Allowed');
error.status = 405;
res.send(error);
```

## Error handling
Error handlers are declared in the same way as a route handler, but with an additional `err` parameter.
```js
app.use(errorHandler);
function errorHandler(err, req, res, next) {
	res.send(err);
}
```
You should include at least one error handler (usually the very last route definition), but you can include multiple error handlers if you need errors to be handled differently throughout the route chain. When an error is thrown or passed to `next`, the next error handler in the chain will be invoked.

#### Generating an error
Inside a typical route, you can invoke the next error handler in the chain by calling `next(error)` or simply throwing an error.
```js
app.use('GET', '/api/retrieve', function (req, res, next) {
	if (req.query.id === 'test') {
		/*respond only to /api/retrieve?id=test*/
		res.send({id: 'test', result: 'success'});
	}
	else {
		/*otherwise, pass an error*/
		var error = new Error('Invalid request')
		next(error);
	}
});
```


## A thorough example
```js
var copilot = require('copilot');
var http = require('http');

var app = copilot();

/*Add middleware (optional)*/
var cookieParser = require('cookie-parser');
app.use(cookieParser());

var bodyParser = require('body-parser');
app.use('POST', bodyParser.urlencoded({extended: false}));
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
```

## Middleware
In many cases, your app will require functionality beyond Copilot's built-in capabilities. Middleware can be used to add functionality such as the ability to parse incoming POST data and cookies.

#### Recommended middleware
 - [body-parser](https://www.npmjs.com/package/body-parser)
 - [cookie-parser](https://www.npmjs.com/package/cookie-parser)

Copilot is compatible with middleware for Express, Restify, and Connect.

## Fair warning
Typically, when an exception occurs in a Node app, the app crashes with the printed stack trace. With Copilot, however, if one of your routes throws an exception, the exception will be caught by the nearest error handler, keeping your app from crashing. This is good for obvious reasons, but can also allow misbehaving logic to go undetected.

For production environments, it is recommended that you implement custom logic within your error handlers to log the stack trace (err.stack) of unexpected errors and generate a notification.

## How Copilot is different
 - [Express](https://www.npmjs.com/package/express) includes support for serving static files and rendering view templates
 - [Restify](https://www.npmjs.com/package/restify) includes built-in REST API functionality and helpers
 - Express and Restify support URL path parameters (e.g. /person/:*name*)
 - [Connect](https://www.npmjs.com/package/connect) does not support HTTP method-based routing
 - Copilot is faster and more flexible, but contains fewer built-in features

### License
[MIT](LICENSE)