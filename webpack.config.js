var path = require("path");
var fs = require('fs');

function output_fn(name, dirname){
  dirname = dirname || 'out';
  var dir = path.resolve(__dirname, dirname) ;
  return { path: dir, filename: name, publicPath: "/" + dirname,
  };
}

module.exports = {
  output_fn: output_fn,
  entry: path.resolve(__dirname, "wdf/index.js"),
  output: output_fn('bundle.js'),
  module: {
    preLoaders: [
      { test: /\.js$/,
        loaders: ['jshint'],
        // define an include so we check just the files we need
        include: [ __dirname + "/wdf", __dirname + "/test" ]
      }
    ],
    loaders: [
      { test: /\.css$/, loader: "style!css" }
    ]
  },

};