var assert = require('assert');
var _ = require("lodash");

var WdfView = require("../wdf/WdfView");
var DataFrame = require("../wdf/DataFrame");


describe( 'WdfView',function() {
  it('A', function () {
    var document = require("./dom_fragment")('<div></div>').document;
    var df = DataFrame.parse_wdf( require('./all_types_wdf') );
    new WdfView({document:document,df:df});

  });
});