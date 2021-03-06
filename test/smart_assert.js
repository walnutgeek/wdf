var assert = require("assert");
var _ = require("lodash");
var u$ = require('../utils');

module.exports = function(expected, result, msg) {
  if (expected instanceof u$.Link){
    assert.equal(expected.href,result.href, msg + ' e:'+expected.href+ ' r:'+result.href);
    assert.equal(expected.text,result.text, msg + ' e:'+expected.href+ ' r:'+result.href);
  } else if (_.isDate(expected)){
    var r = result && result.valueOf();
    var e =expected.valueOf() ;
    assert.equal(e, r, msg + ' e:'+e+ ' r:'+r);
  } else if (isNaN(expected)){
    assert.ok(isNaN(result), msg);
  } else  {
    assert.equal(result, expected, msg);
  }
};