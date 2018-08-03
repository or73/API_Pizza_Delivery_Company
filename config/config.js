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
	'secret'        : 'This key can not be shared, use your own key'
};


config.mailgun      = {
<<<<<<< HEAD
	apiKey  : 'This key can not be shared, use your own key',   // This key can not be shared, use your own key
	domain  : 'This data can not be shared, use your own domain' // This data can not be shared, use your own domain
=======
	apiKey  : 'This key can not be shared, use your own key',
	domain  : 'This data can not be shared, use your own domain',
>>>>>>> origin/master
};


// Export the module
module.exports = config;
