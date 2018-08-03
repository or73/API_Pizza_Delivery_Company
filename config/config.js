/*
* Create and export configuration variables
* */

// General container for all the environments
const config    = {};

// Staging (default) environment
if ( process.env.NODE_ENV === 'production' ) {
	config.httpPort     = process.env.port || 5000;
	config.httpsPort    = config.httpPort + 1;
	config.mode         = process.env.NODE_ENV;
} else {
	config.httpPort     = process.env.port || 3000;
	config.httpsPort    = config.httpPort + 1;
	config.mode         = 'staging';
}


config.hashSecret   = 'thisIsASecret';
config.stripe       = {
	'publishable'  : 'pk_test_wCAFOyUsuRdINLPmVJBDtksz',
	'secret'       : 'sk_test_fAIZCgKKqfBJQ3yo0GVEkACr'
};


config.mailgun      = {
	apiKey  : 'This key can not be shared, use your own key',
	domain  : 'This data can not be shared, use your own domain',
};


// Export the module
module.exports = config;
