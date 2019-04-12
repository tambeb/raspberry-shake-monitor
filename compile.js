var fs = require( 'fs-extra' );
const util = require( 'util' );
const readFile = util.promisify( fs.readFile );
var path = require( 'path' );
const root = path.resolve();
var compile = require( 'google-closure-compiler-js' );
var files = [ 'www/node_modules/lodash/lodash.min.js', 'www/node_modules/vue/dist/vue.min.js', 'www/node_modules/socket.io-client/dist/socket.io.js', 'www/node_modules/chart.js/dist/Chart.bundle.min.js', 'www/chartjs-plugin-downsample.js', 'www/index.js' ]

Promise.all( files.map( openFile ) ).then( function ( data ) {
  data = data.join( '\n' );
  const flags = {
    jsCode: [ { src: data } ],
    compilationLevel: 'SIMPLE',
    rewritePolyfills: false
  };
  const out = compile( flags );
  const output = out.compiledCode;
  let file = path.join( root, 'www', 'index.min.js' );
  fs.writeFileSync( file, output );
} )

function openFile( fileName ) {
  return new Promise( function ( resolve, reject ) {
    let file = path.join( root, fileName );
    readFile( file )
      .then( file => {
        resolve( file );
      } )
      .catch( err => {
        reject( {} );
      } )
  } )
}
