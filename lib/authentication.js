/*
* Library for user tokens validation
* */

// Dependencies
const { errorTemplate,
	parseJsonToObject,
	responseTemplate,
	validateEmail,
	validateStatusCodeOk,
	validateString }    = require( '../lib/helpers' );
const dataService       = require( '../services/data' );

// Instantiating services
const tokenService  = dataService( 'tokens' );

/*
* validateToken
* Validates if a token and an email are correlated
* */
const validateToken = ( tokenId, email ) => {
	const token      = ( validateString( tokenId ) && tokenId.length === 20 ) ? tokenId : false;
	const userEmail  = ( validateString( email ) && validateEmail( email ) ) ? email : false;
	
	if ( token  && userEmail ) {
		let tokenReadMsg = tokenService._read( token );
		if ( validateStatusCodeOk( tokenReadMsg ) ) {
			let tokenData = parseJsonToObject( tokenReadMsg.data );
			
			if ( tokenData.expires > new Date() ) {
				// Validates token: if exist (read from a file), received information is equal to toke's information, and
				// if time is not expired
				if (tokenData.email === userEmail && tokenData.tokenId === token) {
					return responseTemplate(200, 'Token fetched successfully', tokenData);
				} else {
					return errorTemplate( 'EACCESS', ' [ authentication.validateToken ]' );
				}
			} else {
				return errorTemplate( 'ETIME', 'Token expired  [ authentication.validateToken ]');
			}
		} else {
			tokenReadMsg.message += ' [ authentication.validateToken ]';
			return tokenReadMsg;  // return errorTemplate( 'ENODATA', 'Token not found' );
		}
	} else {
		return errorTemplate( 'EINVAL', 'Required fields missing or they were invalid [ authentication.validateToken ]' );
	}
};


module.exports  = {
	validateToken,
};
