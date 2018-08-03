// /*
// * Order Controller
// */
//
//
// // Dependencies

const https         = require( 'https' );
const queryString   = require( 'querystring' );

const config         = require( '../config/config' );
const apiKey        = config.mailgun.apiKey;
const domain        = config.mailgun.domain;
const stripe        = require( 'stripe' )( config.stripe.secret );

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
* Order - POST
* Required data: headers → token, email
* Optional data: None
* Procedure description:    1. Validate tokenId and email are valid strings
*                           2. Validate user exists
*                           3. Validate token is valid
*                           4. Validates if shoppingCard has an item list
*                           5. Validate payment with 'Stripe'
*                           6. Create order object
*                           7. Send email with order's details
*                           8. Stores order object
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
							id: true,
							shoppingCartId: email,
							items: parseJsonToObject(itemListData.items),
							total: itemListData.total,
							paymentMethod: '',
							currency: 'USD',
							authorization: false,
							authorizationDate: `${ orderDate.getDate() }/${ orderDate.getMonth() }/${ orderDate.getFullYear() } ${ orderDate.getHours() }:${ orderDate.getMinutes() }:${ orderDate.getSeconds() }`,
						};
						/*
						* Stripe - START
						* */
						// Create a new customer and then a new charge for that customer
						stripe.customers
							.create( { email } )
							.then(function(customer){
								return stripe.customers.createSource(customer.id, {
									source: 'tok_visa'
								});
							}).then(function(source) {
								return stripe.charges.create({
									amount: itemListData.total,
									currency: 'usd',
									customer: source.customer
								});
							}).then(function(charge) {
								// New charge created on a new customer
								orderObj.id             = charge.id;
								orderObj.authorization  = true;
								orderObj.country        = charge.source.country;
								orderObj.object         = charge.source.object;
								orderObj.paymentMethod  = charge.source.brand;
								orderObj.last4          = charge.source.last4;
								return orderObj;
							}).then( function ( orderObjData ) {
								/*
								* Mailgun - START
								* */
								const emailMessage = {
									from: 'director@grizzlygroup.co',
									to: 'oreyesc@gmail.com',
									subject: 'Order Test',
									html: createHTMLMessage(orderObj),
								};
								try {
									mailgun.messages().send(emailMessage, (err, body) => {
										if (err) {
											return errorTemplate('EINVAL', err.message + ' [ purchaseOrder.orderPost]');
										} else {
												return responseTemplate(201, 'Order was generated', orderObj);
										}
									});
								} catch ( e ) {
									throw errorTemplate('EINVAL', err.message + ' [ purchaseOrder.orderPost]');
								}
								/*
								* Mailgun message - END
								* */
								const poMsg = poService._create( email, parseObjectToJson( orderObj ) );
								if ( validateStatusCodeOk( poMsg ) ) {
									return responseTemplate(201, 'Order was generated', orderObj);
								} else {
									poMsg.message   += ' [ purchaseOrder.orderPost ]';
									throw errorTemplate( poMsg );
								}
							} )
							.catch(function(err) {
								// Deal with an error
								throw responseTemplate( 'EINVAL', err.message );
							});
						/*
						* Stripe - END
						* */
						return responseTemplate( 201, 'Purchase Order created successfully' );
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
		return errorTemplate('EINVAL', 'Missing or invalid required fields [ purchaseOrders.orderPost]');
	}
};

/*
* Order - GET
* Required data: headers → token, email
* Optional data: None
* Procedure description:    1. Validate tokenId and email are valid strings
*                           2. Validate user exists
*                           3. Validate token is valid
*                           4. Read and Validate Purchase Order
* */
const orderGet  = data => {
	const headers   = data.headers;
	const email     = validateString( headers.email ) && validateEmail( headers.email ) ? headers.email : false;
	const token     = validateString( headers.token ) && ( headers.token.length === 20 ) ? headers.token : false;
	
	// Validate email and token
	if ( email && token ) {
		// Validate user exists
		const userValMsg    = userService._read( email );
		if ( validateStatusCodeOk( userValMsg ) ) {
			// validate token
			const tokenValMsg = validateToken(token, email);
			if (validateStatusCodeOk(tokenValMsg)) {
				const readPOMsg = poService._read(email);
				if (validateStatusCodeOk(readPOMsg)) {
					return responseTemplate(200, 'Order fetched successfully', parseJsonToObject(readPOMsg.data));
				} else {
					readPOMsg.message += ' [ purchaseOrders.orderGet ]';
					return readPOMsg;
				}
			} else {
				tokenValMsg.message += ' [ purchaseOrders.orderGet ]';
				return tokenValMsg;
			}
		} else {
			userValMsg.message  += ' [ purchaseOrders.orderGet]';
			return userValMsg;
		}
	} else {
		return errorTemplate( 'EINVAL', 'Missing or invalid required fields.' );
	}
};

module.exports = {
	post    : orderPost,
	get     : orderGet,
};
