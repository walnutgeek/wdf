var path = require("path");
var webpack = require("webpack");

function absdir(r){
  return path.resolve(__dirname, r) ;
}

function output_fn(name, dirname){
  dirname = dirname || 'dist';
  var dir = absdir( dirname) ;
  return { path: dir, filename: name, publicPath: "/" + dirname, library: 'wdf' };
}

function cfg(entry_point, out_file, customizer){
  var c = {
    entry: entry_point,
    output: output_fn(out_file),
    devtool: "source-map",
    module: {
      preLoaders: [
        {
          test: /\.js$/,
          loaders: ['jshint'],
          // define an include so we check just the files we need
          include: ["wdf", "test"].map(absdir)
        }
      ],
      loaders: [
        { test: /\.css$/,
          loader: 'style?minimize!css' },
      ],
    },
    plugins: [
      new webpack.IgnorePlugin(/jsdom/)
    ]
  };
  if(customizer)customizer(c);
  return c;
}

module.exports = [
  cfg("./index.js","wdf.js"),
  cfg("./index.js","wdf.min.js",function(c){
    c.module.loaders.push({
      test: /\.js$/,
      loader: "uglify"
    });
  }),
  cfg("./test/view_entry.js","view.js"),
  cfg("mocha!./test/index.js","testBundle.js")
];