/*
* Users controller
* */

// Dependencies
const { createRandomString,
	errorTemplate,
	responseTemplate,
	parseJsonToObject,
	parseObjectToJson,
	validateEmail,
	validateStatusCodeOk,
	validateString, }   = require( '../lib/helpers' );
const { validateToken } = require( '../lib/authentication' );
const dataService       = require( '../services/data' );

// Instantiating services
const shoppingCartService   = dataService( 'shoppingCarts' );
const tokenService          = dataService( 'tokens' );
const userService           = dataService( 'users' );

/*
* User  - POST
* Required data: payload → email, address, password, name
* Optional data: None
* Description:  1. Validates email, password, address and name
*               2. Creates user object
*               3. Generate tokenId
*               4. Generate token timer
*               5. Validates user exists
*               6. Create user and token
*
* * All data is required to create the user, and two more fields are filled automatically:
*        shoppingCartId: false   --> is a boolean, is true if the user has a shoppingCart
*        ordersBckp: []          --> will contain all the purchase purchaseOrders made by the user
* */
const userPost  = data => {
	const payload   = data.payload;
	const email     = ( validateString( payload.email ) && validateEmail( payload.email ) ) ? payload.email : false;
	const address   = validateString( payload.address ) ? payload.address : false;
	const password  = validateString( payload.password ) ? payload.password : false;
	const name      = validateString( payload.name ) ? payload.name : false;
	
	if ( email && address && password && name ) {
		
		const userServMsg   = userService._read( email );
		if ( !validateStatusCodeOk( userServMsg ) ) {
			const tokenId   = createRandomString( 20 );
			if ( tokenId ) {
				const userData = {email, address, name, password, shoppingCartId: false, ordersBckp: []};
				const expires = Date.now() + 1000 * 60 * 60 * 24;
				// 1000 * 60 = 1 sec   (1000 * 60) * 60 1 hour   (1000 * 60) * 60 * 24 = 1 day
				const tokenObj = {tokenId, email, expires,};
				const userServCreateMsg = userService._create( email, parseObjectToJson( userData ) );
				if (validateStatusCodeOk(userServCreateMsg)) {
					const tokenServCreateMsg = tokenService._create( tokenId, parseObjectToJson( tokenObj ) );
					if (validateStatusCodeOk(tokenServCreateMsg)) {
						delete userData.password;
					} else {
						tokenServCreateMsg.message += '[ users.userPost ]';
						return tokenServCreateMsg;
					}
				} else {
					userServCreateMsg.message += '[ users.userPost ]';
					return userServCreateMsg;
				}
			} else {
				return errorTemplate( 'Bad Request', 'Token was not created', 400 );
			}
		} else {
			userServMsg.message += '[ user.userPost ]';
			return userServMsg; // errorTemplate( 'EEXIST' );
		}
	} else {
		return errorTemplate( 'EINVAL', 'Required fields missing or invalid' );
	}
};


/*
* User - GET
* Required data: queryStringObject → email
*                headers → token
* Optional data: None
* Description:  1. Validate email and token
*               2. Validate token
*               3. Validates user exists
*               4. Return user object or Error message
*
* Two operations are available:
*              1. Get information of one user   --> retrieves information of provided mail's user
*              2. Get a list of existing users  --> retrieves a list of users
*
*      Description                            Path
* Get information of one user    http://localhost:3000/users?valid@email.com
* Get a list of existing users   http://localhost:3000/users?all
* */
const userGet   = data => {
	const queryStringObject = data.queryStringObject;
	const headers           = data.headers;
	const email = ( validateString( queryStringObject.email ) && validateEmail( queryStringObject.email ) ) ? queryStringObject.email : false;
	const token = ( validateString( headers.token ) && headers.token.length === 20 ) ? headers.token : false;
	const all   = ( typeof queryStringObject.all === 'string' && queryStringObject.all.length === 0);
	const tokenEmail = ( validateString( headers.email ) && validateEmail( headers.email ) ) ? headers.email : false;
	
	if ( email && token ) {
		const tokenValidMsg = validateToken( token, email );
		if ( validateStatusCodeOk( tokenValidMsg ) ) {
			const userServReadMsg   = userService._read(email );
			if ( validateStatusCodeOk( userServReadMsg ) ) {
				let userDataObj = parseJsonToObject( userServReadMsg.data );
				delete userDataObj.password;
				return responseTemplate( 200, 'User fetched successfully', userDataObj );
			} else {
				userServReadMsg.message += ' [ users.userGet ]';
				return userServReadMsg;
			}
		} else {
			tokenValidMsg.message   += ' [ users.userGet ]';
			return tokenValidMsg; //errorTemplate( 'EACCESS', 'Token was not validated.' );
		}
	} else if ( all && tokenEmail ) {    // List all users, if a token is provided, but not an email
		const valToken  = validateToken( token, tokenEmail );
		
		if ( validateStatusCodeOk( valToken ) ) {
		 		const usersListDetails = userService._contentOfAllFiles( );
		 		let usersList = [];
				usersListDetails.data.forEach(userObject => {
					const infoObj = JSON.parse(userObject.info);
					const newUserObj = {
						name: infoObj.name,
						address: infoObj.address,
						email: infoObj.email,
					};
					usersList.push(newUserObj);
				});
				return responseTemplate( 200, 'Users list fetched successfully', usersList );
		} else {
		 		return errorTemplate( 'EACCESS', 'Some of provided values  were not validated [ users.userGet ]' );
		}
	} else {
		return errorTemplate( 'EINVAL', 'Missing or invalid required fields [ users.userGet ]' );
	}
};


/*
* User - UPDATE
* Required data: payload → address, password, name
*                queryStringObject → email
*                headers → token
* Optional data: None
* Procedure description:  1. Validate token
*                         2. Validate if user exists in database/file
*                         3. Update user data
*
* email cannot be updated, because it is used as id in several parts of the application
* */
const userUpdate    = data => {
	const payload           = data.payload;
	const queryStringObject = data.queryStringObject;
	const headers           = data.headers;
	
	const email     = ( validateString( queryStringObject.email ) && validateEmail( queryStringObject.email ) ) ? queryStringObject.email : false;
	const address   = validateString( payload.address ) ? payload.address : false;
	const password  = validateString( payload.password ) ? payload.password : false;
	const name      = validateString( payload.name ) ? payload.name : false;
	const token     = ( validateString( headers.token ) && headers.token.length === 20 ) ? headers.token : false;
	
	if ( email || address || password || name ) {
		const tokenValid    = validateToken( token, email );
		if ( validateStatusCodeOk( tokenValid ) ) {
			const userDataMsg  = userService._read( email );
			if ( validateStatusCodeOk( userDataMsg ) ) {
				const userDataJSON = parseJsonToObject( userDataMsg.data );
				const userDataObj = {
					address: address || userDataJSON.address,
					password: password || userDataJSON.password,
					name: name || userDataJSON.name,
					email,
					shoppingCartId: userDataJSON.shoppingCartId,
					orders: userDataJSON.orders,
				};
				const userServUpdMsg = userService._update( email, parseObjectToJson( userDataObj ) );
				if ( validateStatusCodeOk( userServUpdMsg ) ) {
					return responseTemplate(200, `User updated successfully`, userDataObj);
				} else {
					userServUpdMsg.message += ' [ users.userUpdate]';
					return userServUpdMsg; // errorTemplate( 'ENODATA', 'User has not been updated' );
				}
			} else {
				userDataMsg.message += ' [ users.userUpdate]';
				return userDataMsg;  //errorTemplate( 'ENODATA', 'User not found' );
			}
		} else {
			tokenValid.message  += ' [ users.userUpdate]';
			return tokenValid;// errorTemplate( 'EACCESS' );
		}
	} else if ( payload.email ) {
		return errorTemplate( 'EPERM', 'Email cannot be updated [ users.userUpdate]' );
	} else if ( !email ) {
		return errorTemplate( 'EACCESS', 'Email is required [ users.userUpdate]' );
	} else if ( !token ) {
		return errorTemplate( 'EACCESS', 'Token is required [ users.userUpdate]' );
	} else {
		return errorTemplate( 'EINVAL', 'Missing or invalid required fields [ users.userUpdate]' );
	}
};


/*
* User - DELETE
* Required data: queryStringObject → email
*                headers → token
* Optional data: None
* Procedure description:  1. Validate token
*                         2. Validate user exists
*                         3. Delete token, delete shoppingCart (if exists in user), delete user
* */
const userDelete  = data => {
	const queryStringObject = data.queryStringObject;
	const headers           = data.headers;
	
	const email     = ( validateString( queryStringObject.email ) && validateEmail( queryStringObject.email ) ) ? queryStringObject.email : false;
	const token     = ( validateString( headers.token ) && headers.token.length === 20 ) ? headers.token : false;

	if ( email && token ) {
		const tokenValidMsg   = validateToken( token, email );
		// Validate if token file exist
		if ( validateStatusCodeOk( tokenValidMsg ) ) {
			const tokensServMsg    = tokenService._read( token );
			if ( validateStatusCodeOk( tokensServMsg ) ) {
				const usersReadMsg  = userService._read( email );
				if ( validateStatusCodeOk( usersReadMsg) ) {
					const tokenServDel  = tokenService._delete( token );
					if ( validateStatusCodeOk( tokenServDel ) ) {
						const usersShoppingCartId   = parseJsonToObject( usersReadMsg.data ).shoppingCartId;
						const delShoppingCartMsg    = shoppingCartService._delete( email );
						if ( validateStatusCodeOk( delShoppingCartMsg ) || !usersShoppingCartId ) {
							const userServDelMsg   = userService._delete( email );
							if ( validateStatusCodeOk( userServDelMsg ) ) {
								return responseTemplate( 200, `User deleted successfully`, {} );
							} else {
								userServDelMsg.message  += ' [ users.userDelete]';
								return userServDelMsg;  // errorTemplate( 'EPERM', `User associated with ${ email }, has not been deleted` );
							}
						} else {
							delShoppingCartMsg.message  += ' [ users.userDelete]';
							return delShoppingCartMsg;
						}
					} else {
						tokenServDel.message    += ' [ users.userDelete]';
						return tokenServDel; // errorTemplate( 'EPERM', `User associated with ${ email } does not exist` );
					}
				}
				else {
					usersReadMsg.message    += ' [ users.userDelete]';
					return usersReadMsg; // errorTemplate( 'EPERM', `Token associated with ${ email } email, has not been deleted` );
				}
			} else {
				tokensServMsg.message   += ' [ users.userDelete]';
				return tokensServMsg;
			}
		}  else {
			tokenValidMsg.message   += ' [ users.userDelete]';
			return tokenValidMsg;
		}
	} else if ( !token) {
		return errorTemplate( 'EACCESS', ' [ users.userDelete]' );
	}  else {
		return errorTemplate( 'EINVAL', 'Missing or invalid required fields [ users.userDelete]' );
	}
};


module.exports  = {
	post    : userPost,
	get     : userGet,
	put     : userUpdate,
	delete  : userDelete,
};
