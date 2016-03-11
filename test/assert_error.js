var assert = require('assert');

module.exports = function (e ) {
  assert.ok(e instanceof Error);
  var stack = e.stack.split('\n');
  for(var i  = 1 ; i < arguments.length ; i++){
    assert.equal(stack[i-1], arguments[i]);
  }
};
