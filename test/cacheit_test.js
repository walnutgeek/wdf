var assert = require('assert');
var cacheit = require("../cacheit");

describe( 'cacheit',function() {
  it('cacheit', function () {
    var cnt = 0 ;
    function a(){
      cnt ++;
      return 5;
    }
    var x={a: cacheit('cache',a)};
    assert.equal(cnt,0);
    assert.equal(5,x.a());
    assert.equal(cnt,1);
    assert.equal(5,x.a());
    assert.equal(cnt,1);

  });
});