var main=require("./webpack.config");
module.exports = {
  entry: 'mocha!./test/index.js',
  output: main.output_fn('testBundle.js'),
  module: main.module
};