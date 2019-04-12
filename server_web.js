'use strict'
var path = require( 'path' );
var fs = require( 'fs-extra' );
var { fork } = require( 'child_process' );
const readline = require( 'readline' );
const util = require( 'util' );
const readdir = util.promisify( fs.readdir );
var compression = require( 'compression' );
var compression2 = require( 'compression' );
var parse = require( 'date-fns/parse' );
var format = require( 'date-fns/format' );
var startOfHour = require( 'date-fns/start_of_hour' );
var endOfHour = require( 'date-fns/end_of_hour' );
var addMilliseconds = require( 'date-fns/add_milliseconds' );
var differenceInHours = require( 'date-fns/difference_in_hours' );
var addHours = require( 'date-fns/add_hours' );
var subSeconds = require( 'date-fns/sub_seconds' );
var isBefore = require( 'date-fns/is_before' );
var isAfter = require( 'date-fns/is_after' );
var getTime = require( 'date-fns/get_time' );
var l = require( 'lodash' );
const root = path.resolve();
var throttle = {};
var connections = [];
var dataStreams = [];
var dataStreamsData = {};
const dgram = require( 'dgram' );
const serverUdp = dgram.createSocket( 'udp4' );
const dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSS';
const filenameDateFormat = 'YYYYMMDDHH';

var serverSettings = openJsonSync( 'serverWebSettings.json' );
var httpPort = serverSettings.httpPort;
var httpsPort = serverSettings.httpsPort;
var udpPort = serverSettings.udpPort;
var httpsServer = serverSettings.httpsServer;
var passphraseFile = serverSettings.passphraseFile;
var pfxFile = serverSettings.pfxFile;

function settings() {
  var filePath;
  var file;

  this.load = function ( fileName ) {
    filePath = path.join( root, fileName );
    try {
      file = fs.readJsonSync( filePath );
    }
    catch ( err ) {
      fs.copySync( filePath.replace( 'json', 'bak' ), filePath );
      file = fs.readJsonSync( filePath );
    }
  };

  this.saveFile = function () {
    setImmediate( function () {
      fs.writeJson( filePath, file )
        .then( function () {
        } )
        .catch( err => {
        } )
    } );
  }

  this.setSetting = function ( setting, value ) {
    file[ setting ] = value;
    setImmediate( function () {
      fs.writeJson( filePath, file )
        .then( function () {
          fs.copy( filePath, filePath.replace( 'json', 'bak' ), err => {
            if ( err ) {
              // return;
            }
            else {
              // return;
            }
          } )
        } )
        .catch( err => {
        } )
    } );
    this.saveFile();
    return file;
  };

  this.getSettings = function () {
    return file;
  };
}

var webSettings = new settings();
webSettings.load( 'webSettings.json' );

var app;
var server;
var io;

if ( httpsServer ) {
  app = require( 'express' )();
  app.use( compression( { level: 9 } ) );
  app.set( 'x-powered-by', false );
  app.set( 'env', 'production' );
  server = require( 'https' ).createServer( {
    passphrase: fs.readFileSync( passphraseFile ),
    pfx: fs.readFileSync( pfxFile )
  }, app );
  io = require( 'socket.io' )( server );
  server.listen( httpsPort );
  io.on( 'connect', function ( socket ) {
    afterConnection( socket );
  } )
  app.get( [ '/', '/index' ], function ( req, res ) {
    res.set( 'Access-Control-Allow-Origin', '*' );
    res.set( 'cache-control', 'no-cache' );
    let file = path.join( root, 'www', 'index.html' );
    res.sendFile( file );
  } )

  app.get( [ '/:filename', '/*/:filename', '/*/*/:filename', '/*/*/*/:filename', '/*/*/*/*/:filename' ], function ( req, res ) {
    res.set( 'Access-Control-Allow-Origin', '*' );
    try {
      var file = path.join( root, 'www', req.params[ 0 ], req.params.filename );
    }
    catch ( err ) {
      var file = path.join( root, 'www', req.params.filename );
    }
    res.set( 'cache-control', 'no-cache' );
    res.sendFile( file );
  } )
}

var app2 = require( 'express' )();
app2.use( compression2( { level: 9 } ) );
app2.set( 'x-powered-by', false );
app2.set( 'env', 'production' );
var server2 = require( 'http' ).createServer( app2 );
var io2 = require( 'socket.io' )( server2 );
server2.listen( httpPort );
io2.on( 'connect', function ( socket ) {
  afterConnection( socket );
} )

function activeConnections() {
  return new Promise( function ( resolve, reject ) {
    if ( connections.length > 0 ) {
      resolve( true );
    }
    else {
      resolve( false );
    }
  } )
}

app2.get( [ '/', '/index' ], function ( req, res ) {
  res.set( 'Access-Control-Allow-Origin', '*' );
  res.set( 'cache-control', 'no-cache' );
  let file = path.join( root, 'www', 'index.html' );
  res.sendFile( file );
} )

app2.get( [ '/:filename', '/*/:filename', '/*/*/:filename', '/*/*/*/:filename', '/*/*/*/*/:filename' ], function ( req, res ) {
  res.set( 'Access-Control-Allow-Origin', '*' );
  try {
    var file = path.join( root, 'www', req.params[ 0 ], req.params.filename );
  }
  catch ( err ) {
    var file = path.join( root, 'www', req.params.filename );
  }
  res.set( 'cache-control', 'no-cache' );
  res.sendFile( file );
} )

serverUdp.on( 'error', ( err ) => {
} );

serverUdp.on( 'listening', () => {
} );

serverUdp.on( 'message', ( data, rinfo ) => {
  data = JSON.parse( data );
  let msg = data.message;
  let whichStream = data.whichStream;
  if ( dataStreams.indexOf( whichStream ) == -1 ) {
    dataStreams.push( whichStream );
  }
  dataStreams.sort( function ( a, b ) {
    if ( a < b ) return -1;
    else return 1;
  } );
  activeConnections().then( function ( active ) {
    if ( active ) {
      sendUpdate( whichStream, msg );
    }
  } )
} );

serverUdp.bind( {
  address: '127.0.0.1',
  port: udpPort,
  exclusive: true
} );

function enableOverallThrottle( whichThrottle ) {
  if ( whichThrottle == undefined ) {
    for ( let i in dataStreams ) {
      throttle[ i ] = true;
    }
    setTimeout( allThrottlesFalse, ( webSettings.getSettings().chartUpdatesInterval ) * 1000 );
  }
  else {
    throttle[ whichThrottle ] = true;
    setTimeout( function () {
      throttle[ whichThrottle ] = false;
    }, ( webSettings.getSettings().chartUpdatesInterval ) * 1000, whichThrottle );
  }
}
function allThrottlesFalse() {
  for ( let i in throttle ) {
    throttle[ i ] = false;
  }
}
function enableSocketThrottle( id, whichThrottle ) {
  let index = connections.findIndex( function ( o ) {
    return o.id == id;
  } );
  if ( whichThrottle == undefined ) {
    for ( let i in connections[ index ][ 'throttle' ] ) {
      connections[ index ][ 'throttle' ][ i ] = true;
    }
  }
  else {
    connections[ index ][ 'throttle' ][ whichThrottle ] = true;
  }
}
function disableOverallThrottle( which ) {
  throttle[ which ] = false;
}
function disableSocketThrottle( id, whichThrottle ) {
  setTimeout( function () {
    let index = connections.findIndex( function ( o ) {
      return o.id == id;
    } );
    if ( whichThrottle == undefined ) {
      for ( let i in connections[ index ][ 'throttle' ] ) {
        connections[ index ][ 'throttle' ][ i ] = false;
      }
    }
    else {
      connections[ index ][ 'throttle' ][ whichThrottle ] = false;
    }
  }, 100, whichThrottle );
}
function socketNotThrottled( id, whichThrottle ) {
  let index = connections.findIndex( function ( o ) {
    return o.id == id;
  } );
  if ( connections[ index ][ 'throttle' ][ whichThrottle ] == false ) {
    return true;
  }
  else return false;
}
function notThrottled( which ) {
  if ( throttle[ which ] == false ) {
    return true;
  }
  else return false;
}
function addConnection( connection ) {
  let index = connections.findIndex( function ( o ) {
    return o.id == connection.id;
  } );
  let throttleItems = {};
  for ( let i in dataStreams ) {
    throttleItems[ dataStreams[ i ] ] = false;
  }
  let newItem = {
    socket: connection,
    id: connection.id,
    throttle: throttleItems
  };
  if ( index == -1 ) {
    connections.push( newItem );
  }
  else {
    connections.splice( index, 1, newItem );
  }
}
function removeConnection( connection ) {
  let index = connections.findIndex( function ( o ) {
    return o.id == connection.id;
  } );
  if ( index != -1 ) {
    connections.splice( index, 1 );
  }
}
function sendUpdate( whichStream, data ) {
  let dataStreamUpdate = whichStream + '_update';
  data = removeDataType( data );
  data[ 0 ] = fixEpoch( data[ 0 ] );
  data[ 0 ] = reformatEpoch( data[ 0 ] );
  data = singleExpandAndConvertToChartObject( data );
  data = removeBias( data, webSettings.getSettings()[ whichStream + '_bias' ] );
  dataStreamsData[ whichStream ].splice( 0, data.length );
  dataStreamsData[ whichStream ].push( data );
  dataStreamsData[ whichStream ] = l.flattenDeep( dataStreamsData[ whichStream ] );
  let outgoingData = { name: whichStream, data: dataStreamsData[ whichStream ] };
  if ( notThrottled( whichStream ) ) {
    enableOverallThrottle( whichStream );
    for ( let connection of connections ) {
      let socket = connection.socket;
      if ( socketNotThrottled( socket.id, whichStream ) ) {
        enableSocketThrottle( connection.id, whichStream );
        socket.emit( dataStreamUpdate, outgoingData, function ( response ) {
          disableSocketThrottle( socket.id, whichStream );
        } );
      }
    }
  }
}
function sendInitialData() {
  var end = new Date();
  var start = subSeconds( end, webSettings.getSettings().timeHorizon );

  Promise.all( dataStreams.map( function ( which ) {
    return new Promise( function ( resolve, reject ) {
      processRawData( which, start, end ).then( function ( data ) {
        resolve( data );
      } );
    } )
  } ) ).then( function ( data ) {
    for ( let i in data ) {
      dataStreamsData[ data[ i ].name ] = data[ i ].data;
    }
    enableOverallThrottle();
    for ( let connection of connections ) {
      enableSocketThrottle( connection.id );
      let socket = connection.socket;
      socket.emit( 'new', data, function ( response ) {
        disableSocketThrottle( socket.id );
      } );
    }
  } )
}
function historicalDateType( data ) {
  let year = data.year;
  let month = data.month;
  let day = data.day;
  let hour = data.hour;
  if ( !year ) {
    return 'year';
  }
  else if ( !month ) {
    return 'month';
  }
  else if ( !day ) {
    return 'day';
  }
  else if ( !hour ) {
    return 'hour';
  }
}
function getHistoricalLogsListByType( data ) {
  return new Promise( function ( resolve, reject ) {
    let type = historicalDateType( data );
    let file = path.join( root, 'logs' );
    readdir( file ).then( x => {
      x = x.map( y => {
        let datePortion = y.slice( 0, 10 );
        let year = parseDateInfo( datePortion, 'year' );
        let month = parseDateInfo( datePortion, 'month' );
        let day = parseDateInfo( datePortion, 'day' );
        switch ( type ) {
          case 'year':
            return parseDateInfo( datePortion, type );
            break;
          case 'month':
            return ( year == data.year ) ? parseDateInfo( datePortion, type ) : false;
            break;
          case 'day':
            return ( year + month == data.year + data.month ) ? parseDateInfo( datePortion, type ) : false;
            break;
          case 'hour':
            return ( year + month + day == data.year + data.month + data.day ) ? parseDateInfo( datePortion, type ) + ':00' : false;
            break;
        }
      } )
      x = l.compact( x );
      x = l.uniq( x );
      x = l.flatten( x );
      if ( type == 'hour' ) {
        x = addHalfHours( x );
      }
      let final = { type: type, data: x }
      resolve( final );
    } )
  } )
}
function addHalfHours( data ) {
  data = data.map( x => {
    return [ x, x.replace( ':00', ':30' ) ];
  } )
  return l.flatten( data );
}
function afterConnection( socket ) {
  allThrottlesFalse();
  addConnection( socket );
  for ( let i in dataStreams ) {
    let currentStream = dataStreams[ i ];
    disableSocketThrottle( socket.id, currentStream );
    disableOverallThrottle( currentStream );
  }
  if ( httpsServer ) {
    io.emit( 'settings', webSettings.getSettings() );
  }
  io2.emit( 'settings', webSettings.getSettings() );
  socket.on( 'pause', function ( data ) {
    for ( let i in dataStreams ) {
      let currentStream = dataStreams[ i ];
      if ( data ) {
        enableSocketThrottle( socket.id, currentStream );
      }
      else {
        disableSocketThrottle( socket.id, currentStream );
      }
    }
  } )
  socket.on( 'setting', function ( data ) {
    if ( data.setting == 'all' ) {
      for ( let i in data.value ) {
        if ( i == 'timeHorizon' ) {
          if ( data.value[ i ] != webSettings.getSettings().timeHorizon ) {
            setImmediate( sendInitialData );
          }
        }
        webSettings.setSetting( i, data.value[ i ] );
      }
      if ( httpsServer ) {
        io.emit( 'settings', webSettings.getSettings() );
      }
      io2.emit( 'settings', webSettings.getSettings() );
    }
    else {
      webSettings.setSetting( data.setting, data.value );
      if ( httpsServer ) {
        io.emit( 'settings', webSettings.getSettings() );
      }
      io2.emit( 'settings', webSettings.getSettings() );
      if ( data.setting == 'timeHorizon' ) {
        sendInitialData();
      }
    }
  } )
  socket.on( 'getHistoricalList', function ( data, response ) {
    getHistoricalLogsListByType( data ).then( x => {
      response( x );
    } )
  } )
  socket.on( 'getHistoricalData', function ( data, response ) {
    Promise.all( dataStreams.map( function ( which ) {
      return new Promise( function ( resolve, reject ) {
        let file = path.join( root, 'get_historical_data.js' );
        const child = fork( file );
        child.on( 'message', ( m ) => {
          child.kill();
          resolve( m );
        } )
        child.on( 'error', ( m ) => {
          child.kill();
          reject( m );
        } )
        child.send( { which: which, data: data } );
      } )
    } ) ).then( function ( data ) {
      response( data );
    } ).catch( function ( error ) {
      console.log( "child error!", error );
    } )
  } )

  sendInitialData();
  socket.on( 'disconnect', function () {
    removeConnection( socket );
    allThrottlesFalse();
  } )
}
function processRawData( dataType, start, end ) {
  return new Promise( function ( resolve, reject ) {
    var files = getRequiredFilenames( start, end );
    files = files.map( x => {
      return x + '_' + dataType + '.log';
    } );
    Promise.all( files.map( openRawLog ) ).then( function ( data ) {
      let allData = l.flatten( data );
      allData = getTimeRange( allData, start );
      allData = expandAndConvertToChartObject( allData );
      webSettings.setSetting( dataType + '_bias', l.meanBy( allData, 'y' ) );
      allData = removeBias( allData );
      let final = {
        name: dataType,
        data: allData
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
function getRequiredFilenames( start, end ) {
  let range = [];
  range.push( getFilenameDate( start ) );
  let hours = differenceInHours( endOfHour( end ), startOfHour( start ) );
  for ( let i = 1; i <= hours; i++ ) {
    range.push( getFilenameDate( addHours( start, i ) ) );
  }
  return range;
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
function openJsonSync( fileName ) {
  let file = path.join( root, fileName );
  fs.ensureFileSync( file );
  return fs.readJsonSync( file );
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
function singleExpandAndConvertToChartObject( data ) {
  let temp = [];
  let epochStart = data[ 0 ];
  for ( let i = 1; i < data.length; i++ ) {
    let epochNext = format( addMilliseconds( epochStart, ( i - 1 ) * 10 ), dateFormat );
    temp.push( {
      x: getTime( epochNext ),
      y: parseInt( data[ i ] )
    } );
  }
  return temp;
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
function parseDateInfo( data, type ) {
  switch ( type ) {
    case 'year':
      return data.slice( 0, 4 );
      break;
    case 'month':
      return data.slice( 4, 6 );
      break;
    case 'day':
      return data.slice( 6, 8 );
      break;
    case 'hour':
      return data.slice( 8, 10 );
      break;
  }
}
process.on( 'uncaughtException', function ( err ) {
  // var message = err.message;
  // console.log( err );
} )

