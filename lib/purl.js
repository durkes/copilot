var url = require('url');

module.exports = function (request) {
	var result = {};

	if (request.url) {
		result = url.parse(request.url, true);
	}

	request.path = result.pathname || '/';
	request.query = result.query || {};
};