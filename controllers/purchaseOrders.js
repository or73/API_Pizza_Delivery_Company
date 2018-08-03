// /*
// * Order Controller
// */
//
//
// // Dependencies
// // const apiKey            = 'key-ebf57d774c68281db08ac0619bb4e6b5';
// // const domain            = 'sandbox6aa929989dab4b048c7157ab9bf491f2.mailgun.org';
//
// const https         = require( 'https' );
// const queryString   = require( 'querystring' );
//
//
// const config        = require( '../config/config' );
// const apiKey        = config.mailgun.apiKey;
// const domain        = config.mailgun.domain;
//
// const { createHash,
// 	createHTMLMessage,
// 	createRandomString,
// 	errorTemplate,
// 	parseJsonToObject,
// 	parseObjectToJson,
// 	responseTemplate,
// 	validateEmail,
// 	validateStatusCodeOk,
// 	validateString }    = require( '../lib/helpers' );
// const { validateToken } = require( '../lib/authentication' );
//
// const dataService       = require( '../services/data' );
//
// // Services
// const menuService       = dataService( 'menus' );
// const shopCartService   = dataService( 'shoppingCarts' );
// const poService         = dataService( 'purchaseOrders' );
// const tokenService      = dataService( 'tokens' );
// const userService       = dataService( 'users' );
//
// const mailgun       = require( 'mailgun-js' ) ( { apiKey, domain } );
//
// const makeRequestAndEmail   = ( orderObj, data ) => {
// 	console.log( '[ purchaseOrders.makeRequestAndEmail ] - data: ', data );
// 	//return new Promise( ( resolve, reject ) => {
// 	// send email message
// 	mailgun.messages().send(data, (err, body) => {
// 		if (err) {
// 			console.log( '[ order.orderPost ] - err: ', err );
// 			return errorTemplate(err.code, err.message, err.errno);
// 			//return false;
// 		}
// 		console.log('[ order.orderPost ] - body: ', body);
// 		return responseTemplate(201, 'Order was generated', orderObj);
// 		//return true;
// 	} )
// };
//
// 	// return new Promise ( ( resolve, reject) => {
// 	// 	const req   = https.request( options, res => {
// 	// 		let response;
// 	// 		res.setEncoding( 'utf-8' );
// 	// 		res.on( 'data', chunk => {
// 	// 			response    = chunk;
// 	// 		} );
// 	// 		res.on( 'end', () => {
// 	// 			console.log( typeof response );
// 	// 			try {
// 	// 				resolve( parseJsonToObject( response ) );
// 	// 			} catch ( e ) {
// 	// 				resolve( response );
// 	// 			}
// 	// 		} );
// 	// 	} );
// 	// 	req.on( 'error', err => {
// 	// 		console.log( err );
// 	// 		reject( errorTemplate( 'Bad request', `Problem with request: ${ err.message }` ) );
// 	// 	} );
// 	// 	// write data to request body
// 	// 	req.write( data );
// 	// 	req.end();
// 	// } );
// // };
//
// /*
// *
// * 1. Validate tokenId and email are valid strings
// * 2. Validate user exists
// * 3. Validate token is valid
// * 4. Validates if shoppingCard has an item list
// * 5. Create random id for order
// * 6. Create order object
// * */
// const orderPost = data => {
// 	const headers   = data.headers;
// 	console.log( '[ order.orderPost ] - headers: ', headers );
// 	try {
//
// 		const tokenId = (validateString(headers.token) && headers.token.length === 20) ? headers.token : false;
// 		const email = (validateString(headers.email) && validateEmail(headers.email)) ? headers.email : false;
//
// 		console.log( '[ purchseOrders.orderPost ] - tokenId:', tokenId );
// 		console.log( '[ purchseOrders.orderPost ] - email:', email );
//
// 		if ( tokenId && email ) {
// 			const validateTokenMsg  = validateToken( tokenId, email );
// 			if ( validateStatusCodeOk( validateTokenMsg ) ) {
// 				return responseTemplate(200, 'Everything is OK');
// 			} else {
// 				return validateTokenMsg;
// 			}
// 		} else {
// 			return errorTemplate( 'EINVAL', 'Missing or invalid required fields' );
// 		}
//
// 		// if (tokenId && email) {
// 		// 	// validate if user exist
// 		// 	const userServMsg   = userService._read( 'users', email );
// 		// 	//console.log( '[ order.orderPost ] - userServMsg: ', userServMsg );
// 		// 	if (validateStatusCodeOk(userServMsg)) {
// 		// 		const tokenServMsg = tokenService._read('tokens', tokenId);
// 		// 		//console.log( '[ order.orderPost ] - tokenServMsg: ', tokenServMsg );
// 		// 		if (validateStatusCodeOk(tokenServMsg)) {   // validate if token is valid
// 		// 			// Validate if user list contains items
// 		// 			const itemListMsg = menuService._itemList('shoppingCarts', email);
// 		// 			//console.log( '[ order.orderPost ] - itemListMsg:', itemListMsg );
// 		// 			if (validateStatusCodeOk(itemListMsg)) {
// 		// 				const orderId = createRandomString(20);
// 		// 				if (orderId) {
// 		// 					const itemListData = itemListMsg.data;
// 		// 					const orderDate = new Date();
// 		// 					const orderObj = {
// 		// 						id: orderId,
// 		// 						shoppingCartId: email,
// 		// 						items: parseJsonToObject(itemListData.items),
// 		// 						total: itemListData.total,
// 		// 						paymentMethod: '',
// 		// 						currency: 'USD',
// 		// 						authorization: false,
// 		// 						authorizationDate: `${ orderDate.getDate() }/${ orderDate.getMonth() }/${ orderDate.getFullYear() } ${ orderDate.getHours() }:${ orderDate.getMinutes() }:${ orderDate.getSeconds() }`,
// 		// 					};
// 		// 					const data = {
// 		// 						from: 'director@grizzlygroup.co',
// 		// 						to: 'oreyesc@gmail.com',
// 		// 						subject: 'Order Test',
// 		// 						html: `Testing mailgun: ${ createHTMLMessage(orderObj) }`
// 		// 					};
// 		//
// 		// 					const requestMsg    = makeRequestAndEmail( orderObj, data );
// 		// 					if ( validateStatusCodeOk( requestMsg) ) {
// 		// 						return responseTemplate(201, 'Order was generated', orderObj);
// 		// 					} else {
// 		// 						return requestMsg;
// 		// 					}
// 		// 					// send email message
// 		// 					// mailgun.messages().send(data, (err, body) => {
// 		// 					// 	if (err) {
// 		// 					// 		//console.log( '[ order.orderPost ] - err: ', err );
// 		// 					// 		//return errorTemplate(err.code, err.message, err.errno);
// 		// 					// 		return false;
// 		// 					// 	} else {
// 		// 					// 		console.log('[ order.orderPost ] - body: ', body);
// 		// 					// 		//return responseTemplate(201, 'Order was generated', orderObj);
// 		// 					// 		return true;
// 		// 					// 	}
// 		// 					// });
// 		// 					// // process payment
// 		//
// 		// 				} else {
// 		// 					console.log( '[ purchaseOrders.orderPost ] - ENODATA' );
// 		// 					return errorTemplate('ENODATA', 'Order id could not be generated');
// 		// 				}
// 		// 			} else {
// 		// 				console.log( '[ purchaseOrders.orderPost ] - itemListMsg: ', itemListMsg );
// 		// 				return itemListMsg;
// 		// 			}
// 		// 		} else {
// 		// 			console.log( '[ purchaseOrders.orderPost ] - tokenServMsg: ', tokenServMsg );
// 		// 			return tokenServMsg;
// 		// 		}
// 		// 	} else {
// 		// 		console.log( '[ purchaseOrders.orderPost ] - userServMsg: ', userServMsg );
// 		// 		return userServMsg;
// 		// 	}
// 		// } else {
// 		// 	console.log( '[ purchaseOrders.orderPost ] - EINVAL' );
// 		// 	return errorTemplate('EINVAL', 'Missing or invalid required fields');
// 		// }
// 	} catch (e) {
// 		console.log( '[ purchaseOrders.orderPost ] - e: ', e );
// 		return errorTemplate( 'EINVAL',  e.message);
// 	}
// };
//
//
// const orderGet  = () => {};
//
// module.exports = {
// 	post    : orderPost,
// 	get     : orderGet,
// };
