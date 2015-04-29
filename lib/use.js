module.exports = function (stack) {
	return function (method, alias, handler) {
		var route;

		if (typeof method === 'function') {
			handler = method;
			method = '*';
			route = '/';
			alias = '';
		}
		else if (typeof alias === 'function') {
			handler = alias;
			if (method[0] === '/') {
				route = alias = method;
				method = '*';
			}
			else {
				route = '/';
				alias = '';
			}
		}
		else {
			route = alias;
		}

		if (alias[alias.length - 1] === '/') {
			alias = alias.slice(0, -1);
		}

		stack.push({
			alias: alias.toLowerCase(),
			method: method.toUpperCase(),
			route: route,
			handler: handler
		});

		return this;
	};
};