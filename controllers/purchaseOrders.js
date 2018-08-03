// /*
// * Order Controller
// */
//
//
// // Dependencies
const apiKey            = 'key-ebf57d774c68281db08ac0619bb4e6b5';
const domain            = 'sandbox6aa929989dab4b048c7157ab9bf491f2.mailgun.org';

const https         = require( 'https' );
const queryString   = require( 'querystring' );


const config        = require( '../config/config' );
// const apiKey        = config.mailgun.apiKey;
// const domain        = config.mailgun.domain;

const {
	createHash,
	createHTMLMessage,
	createRandomString,
	errorTemplate,
	parseJsonToObject,
	parseObjectToJson,
	responseTemplate,
	validateEmail,
	validateStatusCodeOk,
	validateString
}                       = require( '../lib/helpers' );
const { validateToken } = require( '../lib/authentication' );

const dataService       = require( '../services/data' );

// Services
const menuService       = dataService( 'menus' );
const shopCartService   = dataService( 'shoppingCarts' );
const poService         = dataService( 'purchaseOrders' );
const tokenService      = dataService( 'tokens' );
const userService       = dataService( 'users' );

const mailgun       = require( 'mailgun-js' ) ( { apiKey, domain } );

/*
* Token - POST
* Required data: payload → email, password
* Optional data: None
* Procedure description:  1. Validate user exists
*                         2. Create token object
*                         3. Stores token object
* */
/*
* Order - POST
* Required data: headers → token, email
* Optional data: None
* Procedure description:    1. Validate tokenId and email are valid strings
*                           2. Validate user exists
*                           3. Validate token is valid
*                           4. Validates if shoppingCard has an item list
*                           5. Create random id for order
*                           6. Create order object
*                           7. Send email with order's details
* */
const orderPost = data => {
	const headers   = data.headers;
	const tokenId = (validateString(headers.token) && headers.token.length === 20) ? headers.token : false;
	const email = (validateString(headers.email) && validateEmail(headers.email)) ? headers.email : false;

	if (tokenId && email) {
		// validate if user exist
		const userServMsg   = userService._read( email );
		if (validateStatusCodeOk(userServMsg)) {
			const tokenServMsg = tokenService._read( tokenId);
			if (validateStatusCodeOk(tokenServMsg)) {   // validate if token is valid
				// Validate if user list contains items
				const itemListMsg = shopCartService._itemList( email );
				if (validateStatusCodeOk(itemListMsg)) {
					const orderId = createRandomString(20);
					if (orderId) {
						const itemListData = itemListMsg.data;
						const orderDate = new Date();
						const orderObj = {
							id: orderId,
							shoppingCartId: email,
							items: parseJsonToObject(itemListData.items),
							total: itemListData.total,
							paymentMethod: '',
							currency: 'USD',
							authorization: false,
							authorizationDate: `${ orderDate.getDate() }/${ orderDate.getMonth() }/${ orderDate.getFullYear() } ${ orderDate.getHours() }:${ orderDate.getMinutes() }:${ orderDate.getSeconds() }`,
						};
						const emailMessage = {
							from: 'director@grizzlygroup.co',
							to: 'oreyesc@gmail.com',
							subject: 'Order Test',
							html: createHTMLMessage(orderObj),
						};
						try {
							mailgun.messages().send(emailMessage, (err, body) => {
								if (err) {
									console.log('[ order.orderPost ] - err: ', err);
									return errorTemplate('EINVAL', err.message + ' [ purcahseOrder.orderPost]');
								} else {
										return responseTemplate(201, 'Order was generated', orderObj);
								}
							});
						} catch ( e ) {
							throw errorTemplate('EINVAL', err.message + ' [ purcahseOrder.orderPost]');
						}
						return responseTemplate(201, 'Order was generated', orderObj);
// 		// 					// // process payment
// 		//
					} else {
						return errorTemplate('ENODATA', 'Order id could not be generated  [ purchaseOrders.orderPost]');
					}
				} else {
					itemListMsg.message += ' [ purchaseOrders.orderPost]';
					return itemListMsg;
				}
			} else {
				tokenServMsg.message += ' [ purchaseOrders.orderPost]';
				return tokenServMsg;
			}
		} else {
			userServMsg.message += ' [ purchaseOrders.orderPost]';
			return userServMsg;
		}
	} else {
		console.log( '[ purchaseOrders.orderPost ] - EINVAL' );
		return errorTemplate('EINVAL', 'Missing or invalid required fields [ purchaseOrders.orderPost]');
	}
};

const orderGet  = () => {};

module.exports = {
	post    : orderPost,
	get     : orderGet,
};
