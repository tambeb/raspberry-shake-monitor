'use strict'
var path = require( 'path' );
var fs = require( 'fs-extra' );
const readline = require( 'readline' );
var parse = require( 'date-fns/parse' );
var format = require( 'date-fns/format' );
var addMilliseconds = require( 'date-fns/add_milliseconds' );
var addMinutes = require( 'date-fns/add_minutes' );
var isBefore = require( 'date-fns/is_before' );
var isAfter = require( 'date-fns/is_after' );
var getTime = require( 'date-fns/get_time' );
var l = require( 'lodash' );
const root = path.resolve();
const dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSS';

function getHistoricalData( m ) {
  let which = m.which;
  let data = m.data;
  return new Promise( function ( resolve, reject ) {
    processSingleRawHistoricalFile( which, uglyDate( data ), formatStart( data ), addMinutes( formatStart( data ), 30 ) ).then( function ( data ) {
      resolve( data );
    } );
  } )
}
process.on( 'message', ( m ) => {
  getHistoricalData( m ).then( function ( data ) {
    process.send( data );
  } ).catch( function ( error ) { } );
} );
function processSingleRawHistoricalFile( dataType, file, start, end ) {
  return new Promise( function ( resolve, reject ) {
    file = file + '_' + dataType + '.log';
    openRawLog( file ).then( function ( data ) {
      data = getTimeRange( data, start, end );
      data = expandAndConvertToChartObject( data );
      data = removeBias( data );
      let final = {
        name: dataType,
        data: data
      };
      resolve( final );
    } ).catch( err => {
    } )
  } )
}
function getTimeRange( data, start, end = false ) {
  var length = data.length;
  for ( var i = length - 1; i >= 0; i-- ) {
    if ( isBefore( parse( data[ i ][ 0 ] ), parse( start ) ) ) {
      data = data.slice( i + 1 );
      break;
    }
  }
  if ( end ) {
    length = data.length;
    for ( var i = 0; i < length; i++ ) {
      if ( isAfter( parse( data[ i ][ 0 ] ), parse( end ) ) ) {
        data = data.slice( 0, i + 1 );
        break;
      }
    }
  }
  return data;
}
function openRawLog( fileName ) {
  return new Promise( function ( resolve, reject ) {
    let file = path.join( root, 'logs', fileName );
    fs.pathExists( file ).then( exists => {
      if ( exists ) {
        const rl = readline.createInterface( {
          input: fs.createReadStream( file ).setEncoding( 'utf8' ),
          crlfDelay: Infinity
        } );
        var finalData = [];
        rl.on( 'line', ( line ) => {
          finalData.push( line.split( ',' ) );
        } );
        rl.on( 'close', () => {
          resolve( finalData );
        } );
      }
    } )
  } )
}
function removeBias( data, mean ) {
  let useMean = mean || l.meanBy( data, 'y' );
  data.forEach( function ( item ) {
    item.y -= useMean;
  } )
  return data;
}
function expandAndConvertToChartObject( data ) {
  return l.flattenDeep( data.map( ( v, i ) => {
    let temp = [];
    let epochStart = v[ 0 ];
    for ( let j = 1; j < v.length; j++ ) {
      let epochNext = format( addMilliseconds( epochStart, ( j - 1 ) * 10 ), dateFormat );
      temp.push( {
        x: getTime( epochNext ),
        y: parseInt( v[ j ] )
      } );
    }
    return temp;
  } ) );
}
function uglyDate( data ) {
  let year = data.year;
  let month = data.month - 1;
  let day = data.day;
  let hour = data.hour.slice( 0, 2 );
  let minute = data.hour.slice( 3 );
  let tempDate = new Date( year, month, day, hour, minute );
  return format( tempDate, 'YYYYMMDDHH' );
}
function formatStart( data ) {
  let year = data.year;
  let month = data.month - 1;
  let day = data.day;
  let hour = data.hour.slice( 0, 2 );
  let minute = data.hour.slice( 3 );
  let tempDate = new Date( year, month, day, hour, minute );
  return tempDate;
}
process.on( 'uncaughtException', function ( err ) {
  // var message = err.message;
  // console.log( err );
} )

