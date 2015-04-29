var purl = require('./purl');
var call = require('./call');
var done = require('./done');

module.exports = function () {
	var stack = [];

	function router(request, response, after) {
		after = after || done;
		purl(request);

		var index = 0;
		var path = request.path.toLowerCase();

		function next(error) {
			var layer = stack[index++];
			if (!layer) {
				setImmediate(after, error, request, response);
				return;
			}

			var alias = layer.alias;
			if (path.substr(0, alias.length) !== alias) {
				return next(error);
			}

			var tail = path[alias.length];
			if (tail && tail !== '/' && tail !== '.') {
				return next(error);
			}

			request.route = layer.route;
			call(layer.handler, error, request, response, next);
		}

		next();
	}

	router.use = function (alias, handler) {
		var route = alias;

		if (typeof alias !== 'string') {
			handler = alias;
			alias = '';
			route = '/';
		}
		else if (alias[alias.length - 1] === '/') {
			alias = alias.slice(0, -1);
		}

		stack.push({
			alias: alias.toLowerCase(),
			route: route,
			handler: handler
		});

		return this;
	};

	return router;
};