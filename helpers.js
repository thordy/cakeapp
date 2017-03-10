exports.renderError = function(res, error) {
	console.log(error);
  	error.error_message = error.message;
  	res.render('error', {error: error});	
}
