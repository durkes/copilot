var purl = require('./purl');
var call = require('./call');
var done = require('./done');

module.exports = function () {
	var stack = [];

	function router(request, response, final) {
		var index = 0;
		final = final || done;
		purl(request);

		function next(error) {
			var layer = stack[index++];
			if (!layer) {
				setImmediate(final, error, request, response);
				return;
			}

			var path = request.path;
			var route = layer.route;

			if (path.toLowerCase().substr(0, route.length) !== route) {
				return next(error);
			}

			var tail = path[route.length];
			if (tail && tail !== '/' && tail !== '.') {
				return next(error);
			}

			call(layer.handler, error, request, response, next);
		}

		next();
	}

	router.use = function (route, handler) {
		if (typeof route !== 'string') {
			handler = route;
			route = '';
		}
		else if (route[route.length - 1] === '/') {
			route = route.slice(0, -1);
		}

		stack.push({
			route: route.toLowerCase(),
			handler: handler
		});

		return this;
	};

	return router;
};