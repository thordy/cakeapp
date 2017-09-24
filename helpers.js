var debug = require('debug')('dartapp:helpersmain');

exports.renderError = function(res, error) {
	debug(error);
  	error.error_message = error.message;
  	res.render('error', {error: error});	
}
