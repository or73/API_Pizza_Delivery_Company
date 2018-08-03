/*
* Library for CRUD operations over files
* */


// Dependencies
const fs        = require( 'fs' );
const path      = require( 'path' );
//const makeDir   = require( 'make-dir' );
const outputFileSync    = require( 'output-file-sync' );
const pathExists= require( 'path-exists' );
const {
	errorTemplate,
	parseJsonToObject,
	parseObjectToJson,
	responseTemplate,
	validateStatusCodeOk,
	validateString,
	validateValueInArray,
}           = require( '../lib/helpers' );


const _baseDir      = path.join( __dirname, '../.data' );
const _validEntities= [ 'menus', 'purchaseOrders', 'shoppingCarts', 'users', 'tokens' ];


/*
* Validates if 'entityName' directory exists, if not it is created
* */
// const createDir    = ( dirName ) => {
// 	//if ( validateValueInArray( dirName, _validEntities ) ) {
// 	const dirN  = validateString( dirName ) && validateValueInArray( dirName, _validEntities ) ? dirName : false;
//
// 	if ( dirN )   return makeDir.sync( `${ _baseDir }/${ dirN }` );
// 	else return errorTemplate( 'EINVAL', 'An invalid entity name was sent' );
// };


/*
* Services wrapper.  Contains all valid operations(CRUD) to work with files
* */
const _dataService   = ( entityName ) => {
	/*
	* _create
	* Description: creates a new file, with a file name,  before validates if the file exists, and if fileName and .data are valid
	* Required Data: dirName (name of directory where file will be created), fileName (name of the file - must be a string with length > 0) and .data (its content)
	* Optional Data: None
	* */
	let _create = ( fileName, data ) => {
		const dirN  = validateString( entityName ) && validateValueInArray( entityName, _validEntities ) ? entityName : false;
		const fileN = validateString( fileName ) ? fileName : false;
		// Validate if dirName and fileName are a valid strings
		if ( validateString( fileName ) && validateString( entityName ) ) {
			const filePath  = `${ _baseDir }/${ dirN }/${ fileN }.json`;
			
			// Validate if fileName path already exist, if not then it is created
			const filePathExist = pathExists.sync( `${ filePath }` );
			if ( !filePathExist ) {
				outputFileSync( filePath, data, 'utf-8' );
				return responseTemplate( 200, `${ entityName } - ${ fileName } has been created [ data._create ]`, data );
			} else {
				return errorTemplate( 'EEXIST', `${ fileName } already exists, use update to modify values [ data._create ]` );
			}
		} else {
			return errorTemplate('EINVAL', 'An invalid string value was sent as dirName or fileName [ data.create ]');
		}
	};
	
	/*
	* _read
	* Description: read a file, by its file name,  before validates if the file exists, and if fileName is valid
	* Required Data: dirName, fileName (name of the file - must be a string with length > 0)
	* Optional Data: None
	* */
	let _read  = ( fileName ) => {
		// Validate if dirName and fileName are strings
		const dirN  = validateString( entityName ) && validateValueInArray( entityName, _validEntities ) ? entityName : false;
		const fileN = validateString( fileName ) ? fileName : false;
		
		if ( dirN && fileN ) {
			const filePath = `${ _baseDir }/${ dirN }/${ fileName }.json`;
			
			// Validate if file exists
			const fileExist = pathExists.sync( filePath );
			if ( fileExist ) {
				// If exists read info
				const fileDesc  = fs.openSync( filePath, 'r');
				if ( fileDesc ) {
					const fileData  = fs.readFileSync( fileDesc, 'utf8' );
					if ( fileData ) {
						fs.closeSync( fileDesc );
						return responseTemplate( 200, 'File fetched successfully', fileData );
					} else {
						return errorTemplate( 'ENOENT', 'No data was fetched [ data._read ]' );
					}
				} else {
					return errorTemplate( 'ENOENT', 'File could not be opened [ data._read ]' );
				}
			} else {
				// Else return error, file does not exist
				return errorTemplate( 'ENOENT', `${ fileName } does not exist [ data._read ]` );
			}
		} else {
			return errorTemplate( 'EINVAL', 'Provided values are invalid (directory/file) [ data._read ]' );
		}
	};
	
	/*
	* _udpate
	* Description: update a file, by its file name, before validates if the file exists, and if fileName and .data are valid
	* Required Data: fileName (name of the file - must be a string with length > 0) and .data (a not empty object)
	* Optional Data: None
	* */
	let _update    = ( fileName, newData ) => {
		// Validate if dirName and fileName are valid strings, and if newData is a JSON object
		const dirN  = validateString( entityName ) && validateValueInArray( entityName, _validEntities ) ? entityName : false;
		const fileN = validateString( fileName ) ? fileName : false;
		const newD  = validateString( newData ) ? parseJsonToObject( newData ) : newData;
		
		// Validate fileName exists
		const filePath = `${ _baseDir }/${ dirN }/${ fileN }.json`;
		// Validate if file exists
		const fileExist = pathExists.sync( filePath );
		if ( fileExist ) {
			const fileDesc  = fs.openSync( filePath, 'r+');
			if ( fileDesc ) {
				fs.truncateSync( filePath );
				fs.writeFileSync(fileDesc, parseObjectToJson( newD ), 'utf8');
				fs.closeSync(fileDesc);
				return responseTemplate(200, 'File updated successfully', newD );
			} else {
				return errorTemplate( 'ENOENT', 'File could not be opened [ data._update ]' );
			}
		} else {
			return errorTemplate( 'ENOENT', `${ fileName } file does not exist [ data._update ]` );
		}
	};
	
	/*
	* _delete
	* Description: delete a file, by its file name, before validates if the files exits, and if fileName is valid
	* Required Data: fileName (name of the file - must be a string with a length > 0)
	* Optional Data: None
	* */
	let _delete    = ( fileName ) => {
		// Validate if dirName and fileName are valid strings
		const dirN  = validateString( entityName ) && validateValueInArray( entityName, _validEntities ) ? entityName : false;
		const fileN = validateString( fileName ) ? fileName : false;
		
		// Validate fileName exists
		const filePath = `${ _baseDir }/${ dirN }/${ fileN }.json`;
		// Validate if file exists
		const fileExist = pathExists.sync( filePath );
		if ( fileExist ) {
			fs.unlinkSync( filePath );
			return responseTemplate( 200, `${ fileName } was deleted`, {} );
		} else {
			return errorTemplate( 'ENOENT', `${ fileName } file does not exist [ data._delete ]` );
		}
	};
	
	/*
	* _contentOfAllFiles
	* Description: Return an array of objects which contains objects of files with its content
	* Required Data: dirName (name of desired directory)
	* Optional Data: None
	* */
	let _contentOfAllFiles = () => {
		const dirN  = validateString( entityName ) && validateValueInArray( entityName, _validEntities ) ? entityName : false;
		if ( dirN ) {
			const dirPath = `${ _baseDir }/${ dirN }`;
			let filesObjectsArray = [];
			let fileData, fileDescriptor, filesNamesArray;
			const filesList = fs.readdirSync(dirPath);
			if ( filesList ) {
				filesNamesArray = filesList.map(fileName => fileName);
				filesNamesArray.forEach(fileName => {
					fileDescriptor = fs.openSync(`${ dirPath }/${ fileName }`, 'r');
					if ( fileDescriptor ) {
						fileData = fs.readFileSync(fileDescriptor, 'utf8');
						if ( fileData ) {
							fs.closeSync(fileDescriptor);
							let newObject = {
								'name': fileName.substring(0, fileName.lastIndexOf('.')),
								'info': fileData
							};
							filesObjectsArray.push(newObject);
						} else {
							return errorTemplate( 'ENODATA' );
						}
					} else {
						return errorTemplate( 'ENOENT' );
					}
				});
				return responseTemplate( 200, 'All files and their contents have been fetched successfully', filesObjectsArray );
			} else {
				return errorTemplate( 'ENODATA' );
			}
		} else {
			return errorTemplate( 'ENOENT [ data._contentOfAllFiles ]' );
		}
	};
	
	/*
	*  _itemList
	*  Description: Validates if a shopping Cart exist and returns its item list content
	*  Required data: dirName (name of desired directory), fileName(name of desired file)
	*  Optional data: none
	* */
	let _itemList = ( fileName ) => {
		const fileN = validateString( fileName ) ? fileName : false;
		
		const shoppingCardMsg   = _read( fileN );
		if ( validateStatusCodeOk( shoppingCardMsg ) ) {
			const shoppingCartData  = shoppingCardMsg.data;
			const shoppingCartObj   = parseJsonToObject( shoppingCartData );
			
			const itemsListObj  = {
				items   : parseObjectToJson( shoppingCartObj.items ),
				total   : parseJsonToObject( shoppingCartObj.total ),
			};
			return responseTemplate( 200, 'Item list fetched successfully',  itemsListObj );
		} else {
			shoppingCardMsg.message += ' [ data._itemList ]';
			return shoppingCardMsg;
		}
	};
	
	/*
	* _namesOfAllFiles
	* Description: Return a list of all files names into a directory
	* Required Data: dirName (name of desired directory)
	* Optional Data: None
	* */
	let _namesOfAllFiles = () => {
		const dirN  = validateString( entityName ) && validateValueInArray( entityName, _validEntities ) ? entityName : false;
		if ( dirN ) {
			const dirPath   = `${ _baseDir }/${ dirN }`;
			const existPath = pathExists( dirPath );
			if ( existPath ) {
				const filesList = fs.readdirSync(dirPath);
				
				return responseTemplate( 200,
					'List fetched successfully',
					filesList.map( fileName => fileName.substring( 0, fileName.lastIndexOf( '.' ) ) ) );
				//fileName.trim().replace( /(\..*)$/, '' ) );
			} else {
				return errorTemplate( 'ENOENT', `${ dirN } does not exist [ data._namesOfAllFiles]` );
			}
		} else {
			return errorTemplate( 'EINVAL [ data._namesOfAllFiles ]' );
		}
	};
	
	return { _create, _read, _update, _delete, _contentOfAllFiles, _itemList, _namesOfAllFiles };
};

module.exports  = _dataService;
