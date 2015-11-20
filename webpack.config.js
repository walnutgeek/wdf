var path = require("path");

function absdir(r){
  return path.resolve(__dirname, r) ;
}

function output_fn(name, dirname){
  dirname = dirname || 'dist';
  var dir = absdir( dirname) ;
  return { path: dir, filename: name, publicPath: "/" + dirname, library: 'wdf' };
}


module.exports = {
  _output_fn: output_fn,
  entry: absdir("index.js"),
  output: output_fn('wdf.js'),
  devtool: "cheap-source-map",
  module: {
    preLoaders: [
      { test: /\.js$/,
        loaders: ['jshint'],
        // define an include so we check just the files we need
        include: [ "/wdf", "/test"].map(absdir)
      }
    ],
    loaders: []
  },

};