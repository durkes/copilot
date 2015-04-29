module.exports = function (stack) {
	return function (alias, handler) {
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
};