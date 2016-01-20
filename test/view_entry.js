require("../wdf/wdf_view.css");
var WdfView = require("../wdf/WdfView");

if( WdfView.hasDefault('document') ){
  var DataFrame = require("../wdf/DataFrame");
  var df = DataFrame.parse_wdf( require('./all_types_wdf') );
  module.exports = {WdfView:WdfView, DataFrame: DataFrame, df: df};
}
