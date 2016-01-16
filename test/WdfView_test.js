var assert = require('assert');
var _ = require("lodash");

var WdfView = require("../wdf/WdfView");
var DataFrame = require("../wdf/DataFrame");

var document = require("./dom_fragment")('<div></div>').document;

describe( 'WdfView',function() {
  it('A', function () {
    var df = DataFrame.parse_wdf( require('./all_types_wdf') );
    new WdfView(document,df);

  });
});