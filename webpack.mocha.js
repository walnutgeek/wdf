var cfg=require("./webpack.config");
cfg.entry = 'mocha!./test/index.js';
cfg.output = cfg._output_fn('testBundle.js');
module.exports = cfg;