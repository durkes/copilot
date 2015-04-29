var use = require('./use');
var url = require('./url');
var call = require('./call');
var exit = require('./exit');

module.exports = function () {
	var stack = [];

	function router(request, response, after) {
		after = after || exit;

		url(request);
		var path = request.path.toLowerCase();
		var index = 0;
		next();

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
			if (tail !== undefined && tail !== '/' && tail !== '.') {
				return next(error);
			}

			var method = layer.method;
			if (method !== '*' && method !== request.method) {
				return next(error);
			}

			request.route = layer.route;
			call(layer.handler, error, request, response, next);
		}
	}

	router.use = use(stack);
	return router;
};