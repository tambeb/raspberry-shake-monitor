'use strict'
var path = require( 'path' );
var fs = require( 'fs-extra' );
var parse = require( 'date-fns/parse' );
var format = require( 'date-fns/format' );
const root = path.resolve();
const dgram = require( 'dgram' );
const serverUdpShake = dgram.createSocket( 'udp4' );
const serverUdpWeb = dgram.createSocket( 'udp4' );
const dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSS';
const filenameDateFormat = 'YYYYMMDDHH';

var serverSettings = openJsonSync( 'serverLoggerSettings.json' );
var udpPortServerWeb = serverSettings.udpPortServerWeb;
var udpPortShake = serverSettings.udpPortShake;

function sendUpdateToServerWeb( whichStream, msg ) {
  let data = JSON.stringify( { whichStream: whichStream, message: msg } );
  serverUdpWeb.send( data, udpPortServerWeb, ( err ) => {
  } );

}

serverUdpShake.on( 'error', ( err ) => {
  serverUdpShake.close();
} );

serverUdpShake.on( 'listening', () => {
} );

serverUdpShake.on( 'message', ( msg, rinfo ) => {
  msg = `${ msg }`;
  msg = removeBraces( msg );
  msg = removeSingleQuotes( msg );
  msg = msg.trimStart().split( ',' );
  let whichStream = whichDataStream( msg );
  rawAppend( msg );
  sendUpdateToServerWeb( whichStream, msg );
} );

serverUdpShake.bind( udpPortShake );

function rawAppend( msg ) {
  let dataType = msg[ 0 ];
  msg = removeDataType( msg );
  msg[ 0 ] = fixEpoch( msg[ 0 ] );
  let file = getFilenameDate( msg[ 0 ] ) + '_' + dataType + '.log';
  msg[ 0 ] = reformatEpoch( msg[ 0 ] );
  appendNewLine( msg, file );
}
function whichDataStream( msg ) {
  return msg[ 0 ];
}
function openJsonSync( fileName ) {
  let file = path.join( root, fileName );
  fs.ensureFileSync( file );
  return fs.readJsonSync( file );
}
function removeBraces( data ) {
  return data.replace( /[{}]/g, '' );
}
function removeSingleQuotes( data ) {
  return data.replace( /'/g, '' );
}
function removeDataType( data ) {
  return data.slice( 1 );
}
function fixEpoch( data ) {
  return ( data * 1000 );
}
function reformatEpoch( data ) {
  return format( parse( data ), dateFormat );
}
function getFilenameDate( data ) {
  return format( parse( data ), filenameDateFormat );
}
function appendNewLine( data, filename ) {
  let file = path.join( root, 'logs', filename );
  fs.ensureFile( file ).then(
    () => {
      fs.appendFile( file, data + '\n', function ( err ) { } );
    }
  )
}
process.on( 'uncaughtException', function ( err ) {
  // var message = err.message;
  // console.log( err );
} )
