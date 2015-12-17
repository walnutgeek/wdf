var assert = require("assert");
var _ = require("lodash");
module.exports = function(expected, result, msg) {
  if (isNaN(expected)){
    assert.ok(isNaN(result), msg);
  } else if (_.isDate(expected)){
    var r = result && result.valueOf();
    var e =expected.valueOf() ;
    assert.equal(e, r, msg + ' e:'+e+ ' r:'+r);
  } else {
    assert.equal(result, expected, msg);

  }
};