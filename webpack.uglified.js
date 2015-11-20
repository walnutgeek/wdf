var cfg=require("./webpack.config");
cfg.output = cfg._output_fn('wdf.min.js');
cfg.module.loaders.push({
    test: /\.js$/,
    loader: "uglify"
  });
module.exports = cfg;