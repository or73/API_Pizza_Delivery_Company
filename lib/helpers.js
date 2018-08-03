/*
	Helpers for various tasks
*/


// Dependencies
const crypto	= require( 'crypto' );
const config	= require( '../config/config' );
const isEmail   = require( 'isemail' );

// return array of elements, from an array of objects
// const arrayElements = arrayObjects => {
// 	if ( arrayObjects.length > 0 ) {
// 		let arrItemsNamesList   = [];
// 		arrayObjects.forEach( itemObject => {
// 			arrItemsNamesList.push( itemObject.name );
// 		});
// 		return responseTemplate( 200, 'Item list fetched successfully', arrItemsNamesList );
// 	} else {
// 		return errorTemplate( 'ENODATA', 404, 'Not items in array' );
// 	}
// };


// Create a SHA256 hash
const createHash	= str => {
	if ( validateString( str ) ) {
		return crypto.createHmac( 'sha256', config.hashSecret ).update( str ).digest( 'hex' );
	} else {
		return false;
	}
};


// Create web message - HTML
const createHTMLMessage = orderObj => {
	console.log( '[ helpers ] - orderObj: ', orderObj );
	let htmlMessage   = '<html>';
	htmlMessage += '<body style="background-color: #f6f6f6;"><table style="background-color: #f6f6f6; width: 100%;">';
	htmlMessage += '<tr><td></td>';
	htmlMessage += '<td style="display: block !important; max-width: 600px !important; margin: 0 auto !important; clear: both !important;" width="600">';
	htmlMessage += '<div style="max-width: 600px; margin: 0 auto; display: block; padding: 20px;">';
	htmlMessage += '<table style="background-color: #fff; border: 1px solid #e9e9e9; border-radius: 3px" width="100%" cellpadding="0" cellspacing="0"><tr>';
	htmlMessage += '<td style="padding: 2px; text-align: center;" class="content-wrap aligncenter">';
	htmlMessage += '<table width="100%" cellpadding="0" cellspacing="0"><tr>';
	htmlMessage += '<td style="padding: 0 0 20px;" ">';
	htmlMessage += `<h1 style="text-align: center;"><strong>Total:$ ${ orderObj.total } Paid</strong></h1></td></tr><tr>`;
	htmlMessage += '<td style="padding: 0 0 20px;">';
	htmlMessage += '<h2 style="text-align: center;">Thanks for using Acme Inc.</h2></td></tr><tr>';
	htmlMessage += '<td style="padding: 20px; text-align: center;">';
	htmlMessage += '<table style="margin: 40px auto; text-align: left; width: 80%;"><tr>';
	htmlMessage += `<td><strong>Order Id:</strong>${ orderObj.shoppingCartId }</br><strong>Invoice #</strong>${ orderObj.id }</br><strong>Authorization Date</strong>${ orderObj.authorizationDate }</br></td></tr><tr><td>`;
	htmlMessage += '<table style="width: 100%;" cellpadding="0" cellspacing="0"><tr>';
	htmlMessage += '<td>Service 1</td>';
	htmlMessage += '<td style="text-align: right;">$ 19.99</td></tr><tr><td>Service 2</td>';
	htmlMessage += '<td style="text-align: right">$ 9.99</td></tr><tr><td>Service 3</td>';
	htmlMessage += '<td style="text-align: right;">$ 4.00</td></tr><tr style="border-top: 2px solid #333;">';
	htmlMessage += '<td style="text-align: right;" width="80%">Total</td>';
	htmlMessage += `<td style="text-align: right;">$ ${ orderObj.total }</td>`;
	htmlMessage += '</tr></table></td></tr></table></td></tr><tr>';
	htmlMessage += '<td style="padding: 0 0 20px; text-align: center">';
	htmlMessage += '<a href="http://www.mailgun.com">View in browser</a></td></tr><tr>';
	htmlMessage += '<td style="padding: 0 0 20px; text-align: center">';
	htmlMessage += 'Acme Inc. 123 Van Ness, San Francisco 94102';
	htmlMessage += '</td></tr></table></td></tr></table>';
	htmlMessage += '<div style="width: 100%; clear: both; color: #999; padding: 20px;">';
	htmlMessage += '<table width="100%"><tr>';
	htmlMessage += '<td style="padding: 0 0 20px; text-align: center">Questions? Email <a href="mailto:">support@acme.inc</a></td>';
	htmlMessage += '</tr></table></div></div></td><td></td></tr></table></body></html>';
	return htmlMessage;
};

// Create a string of random alphanumeric characters of a given length
const createRandomString  = strLength => {
	strLength   = typeof ( strLength ) === 'number' && strLength > 0 ? strLength : false;
	
	if ( strLength ) {
		// Define all the possible characters that could go into a string
		let possibleCharacters  = 'abcdefghijklmnopqrstuvwxyz0123456789';
		
		// start the final string
		let str = '';
		for ( let i = 1; i <= strLength; i++ ) {
			// Get a random character from the possibleCharacters string
			str += possibleCharacters.charAt( Math.floor( Math.random() * possibleCharacters.length ) );
		}
		return str;
	} else {
		return false;
	}
};

// Extracts entity name from folder name
const entityName    = dirName => {
	return dirName.slice( 0, -1 );
};

const errorTemplate   = ( code='Bad Request', message = '', statusCode = 400 ) => {
	if ( validateString( code ) ) {
		const eCode = code.toUpperCase();
		let error = { id: 'error', code, message, statusCode, };
		error.code      = code;
		switch (eCode) {
			case 'EACCESS':
				error.statusCode     = 403;
				error.message   = `Permission denied... Insufficient permissions.   ${ message }`;
				break;
			case 'EEXIST':
				error.statusCode     = 451;
				error.message   = `File or directory already exists.   ${ message }`;
				break;
			case 'EINVAL':
				error.statusCode     = 412;
				error.message   = `Invalid argument. ${ message }`;
				break;
			case 'ENODATA':
				error.statusCode     = 404;
				error.message   = `No data available. ${ message }`;
				break;
			case 'ENOENT':
				error.statusCode     = 404;
				error.message   = `No such file or directory. ${ message }`;
				break;
			case 'EPERM':
				error.statusCode     = 405;
				error.message   = `Operation not permitted. ${ message }`;
				break;
			case 'ETIME':
				error.statusCode     = 428;
				error.message   = `Timer expired. ${ message }`;
				break;
			default:
				error.statusCode     = statusCode;
				error.message   = message;
				break;
		}
		return error;
	} else {
		console.log( '[ helpers.errorTemplate ] - code: ', code );
		return {
			message: 'An unknown error was send'
		};
	}
};

// Parse a JSON string to an object in all cases, without throwing
const parseJsonToObject	= str => {
	try {
		return JSON.parse( str );
	} catch ( e ) {
		return false;
	}
	//return JSON.parse( str );
};

// Parse an object to s JSON string in all cases, without throwing
const parseObjectToJson = obj => {
	try {
		JSON.stringify( obj );
	} catch ( e ) {
		return false;
	}
	return JSON.stringify( obj );
};

const responseTemplate  = ( statusCode, message, data ) => {
	return { id: 'answer', statusCode, message, data };
};

const validateArray = arr => {
	return ( typeof arr instanceof Array && arr.length > 0 );
};

const validateEmail = ( email ) => {
	// const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	//
	// return re.test( email );
	return isEmail.validate( email );
};

function validateString ( stringToValidate ) {
	return typeof stringToValidate === 'string' && stringToValidate.length > 0;
}

const validateStatusCodeOk  = data => {
	return ( data.statusCode === 200 || data.statusCode === 201 );
};

const validateValueInArray  = ( value, dataArray ) => {
	return dataArray.includes(value);
};


module.exports  = {
	createHash,
	createHTMLMessage,
	createRandomString,
	entityName,
	errorTemplate,
	parseJsonToObject,
	parseObjectToJson,
	responseTemplate,
	validateArray,
	validateEmail,
	validateStatusCodeOk,
	validateString,
	validateValueInArray,
};
