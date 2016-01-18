require("../wdf/wdf_view.css");

var document = require('./dom_fragment')('<div></div>').document;

var WdfView = require("../wdf/WdfView");
var DataFrame = require("../wdf/DataFrame");
var df = DataFrame.parse_wdf( require('./all_types_wdf') );

module.exports = new WdfView({ document:document, df: df});