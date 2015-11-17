var assert = require('assert');

function testArrays(expected, actual) {
  assert.equal(expected.length, actual.length );
  for ( var i = 0; i < expected.length; i++) {
    assert.equal(expected[i], actual[i]);
  }
}

var u$ = require("../wdf/utils");
var t$ = require("../wdf/types");


describe( 'wdf/utils',function(){
  it( '#assert', function() {
    u$.assert("aa", "aa");
    u$.assert("aa", [ "qq", "aa" ]);
    try {
      u$.assert("aa", "bb");
    } catch (x) {
      assert.equal(x.toString(),
          "Unexpected value {\"expected\":\"bb\",\"provided\":\"aa\"}");
      assert.equal(x.params.expected, "bb");
      assert.equal(x.params.provided, "aa");
    }
    var arr = [ "cc", "bb" ];
    try {
      u$.assert("aa", arr);
    } catch (x) {
      assert.equal(x.toString(),
          "Unexpected value {\"expected\":[\"cc\",\"bb\"],\"provided\":\"aa\"}");
      assert.equal(x.params.expected, arr);
      assert.equal(x.params.provided, "aa");
    }
    try {
      u$.assert("aa", "bb", "haha");
    } catch (x) {
      assert.equal(x.toString(), "haha {\"expected\":\"bb\",\"provided\":\"aa\"}");
      assert.equal(x.params.expected, "bb");
      assert.equal(x.params.provided, "aa");
    }
  });
  it( '#applyOnAll', function() {
    u$.applyOnAll({
      a : "b",
      b : "c"
    }, function(v, k, obj) {
      assert.ok(obj instanceof Object);
      if (k === "a") {
        assert.equal(v, "b");
      } else if (k === "b") {
        assert.equal(v, "c");
      } else {
        assert.ok(false, "What the hell is:" + k);
      }
    });
  });
  it( '#escapeXmlBody', function() {
    assert.equal("&lt;body&gt;&amp;aaa; single quote = ' &amp; double quote = \" &lt;/body&gt;",
        u$.escapeXmlBody("<body>&aaa; single quote = ' & double quote = \" </body>"));
  });
  it( '#escapeXmlAttribute', function() {
    assert.equal("&lt;body&gt;&amp;aaa; single quote = &#39; &amp; double quote = &quot; &lt;/body&gt;",
        u$.escapeXmlAttribute("<body>&aaa; single quote = ' & double quote = \" </body>"));
  });
  it( '#Tokenizer', function() {
    var tt = u$.Tokenizer("a/b/c//dd/x/v/l", "/?&=");
    assert.equal(tt.nextDelimiter(), "");
    assert.equal(tt.nextValue(), "a");
    assert.equal(tt.nextDelimiter(), "/");
    assert.equal(tt.nextValue(), "b");
    assert.equal(tt.nextDelimiter(), "/");
    assert.equal(tt.nextValue(), "c");
    assert.equal(tt.nextDelimiter(), "//");
    assert.equal(tt.nextValue(), "dd");
    assert.equal(tt.nextDelimiter(), "/");
    assert.equal(tt.nextValue(), "x");
    assert.equal(tt.nextDelimiter(), "/");
    assert.equal(tt.nextDelimiter(), "");
    assert.equal(tt.nextValue(), "v");
    assert.equal(tt.nextDelimiter(), "/");
    assert.equal(tt.nextValue(), "l");
    assert.equal(tt.nextValue(), "");
    assert.equal(tt.nextDelimiter(), "");
  });
  it( '#BiMap', function() {
    var m = u$.BiMap( { a: 1, b: 2} );
    assert.equal(m.get('a'), 1);
    assert.equal(m.get('b'), 2);
    assert.equal(m.key(2), 'b');
    assert.equal(m.key(3), null);
    m.put('z', 3);
    assert.equal(m.key(3), 'z');
    m.del('b');
    assert.equal(""+m.keys(), "a,z");
  });
  it( '#isArray', function() {
    assert.ok(u$.isArray([ 1, 2, 3 ]));
    assert.ok(!u$.isArray(1));
    assert.ok(!u$.isArray(function() {}));
  });
  it( '#extractFunctionName', function() {
    function a(){return 5;}
    assert.equal("a", u$.extractFunctionName(a));
    function $_a(){return 5;}
    assert.equal("$_a", u$.extractFunctionName($_a));
  });
  it( '#append', function() {
    var x = {
      a : "a",
      b : "b"
    };
    u$.append(x, {
      b : "b2",
      c : "c"
    });
    assert.equal(x.a, "a");
    assert.equal(x.b, "b2");
    assert.equal(x.c, "c");
  });
  it( '#size', function() {
    assert.equal(u$.size({}), 0);
    assert.equal(u$.size({
      a : "a",
      b : "b"
    }), 2);
    assert.equal(u$.size({
      a : "a"
    }), 1);
  });
  it( '#join', function() {
    assert.equal(u$.join([ 1, 2, 3 ]), "1,2,3");
    assert.equal(u$.join([ 1, 2, 3 ], function(array, from_start, from_end) {
      return from_start === -1 ? "[" : from_end === -1 ? "]" : ",";
    }), "[1,2,3]");
    var m = {
      a : 1,
      b : 2,
      c : 3
    };
    assert.equal(u$.join(m, "", function(k, m) {
      return m[k];
    }), "123");
    assert.equal(u$.join(m, null, function(k, m) {
      return m[k];
    }), "1,2,3");
    assert.equal(u$.join(m, undefined, function(k, m) {
      return m[k];
    }), "1,2,3");
    assert.equal(u$.join(m), "a,b,c");
    assert.equal(u$.join(m, function(array, from_start, from_end) {
      return from_start === -1 ? "[" : from_end === -1 ? "]" : ",";
    }), "[a,b,c]");
    assert.equal(u$.join(m, function(array, from_start, from_end) {
      return from_start === -1 ? "[" : from_end === -1 ? "]" : ",";
    }, function(k, m) {
      return m[k];
    }), "[1,2,3]");
  });
  it( '#isString', function() {
    assert.equal(u$.isString("abc"), true);
    assert.equal(u$.isString(String("abc")), true);
    assert.equal(u$.isString(5), false);
    assert.equal(u$.isString([]), false);
  });
  it( '#splitUrlPath', function() {
    function test(path, compare_with){
      assert.equal(JSON.stringify(u$.splitUrlPath(path)), compare_with );
    }
    test("abc",'{"path":["abc"],"variables":{}}');
    test("http://abc.com/index.html",'{"path":["http:","","abc.com","index.html"],"variables":{}}');
    test("/app.html?&_suid=141740660296307673981441184878",'{"path":["","app.html"],"variables":{"_suid":"141740660296307673981441184878"}}');
    test("/events/T7?&_suid=141740833138706824455889873207",'{"path":["","events","T7"],"variables":{"_suid":"141740833138706824455889873207"}}');
    test("",'{"path":[""],"variables":{}}');
    test("/events/z3?q=askhsj%20hdjk&_suid=141749092391407243743964936584",'{"path":["","events","z3"],"variables":{"q":"askhsj hdjk","_suid":"141749092391407243743964936584"}}');
    var split =u$.splitUrlPath("/events/z3?q=askhsj%20hdjk&_suid=141749092391407243743964936584");
    assert.equal(split.toString(), "/events/z3?q=askhsj%20hdjk&_suid=141749092391407243743964936584" );
    delete split.variables._suid;
    assert.equal(split.toString(), "/events/z3?q=askhsj%20hdjk" );
    delete split.variables.q;
    assert.equal(split.toString(), "/events/z3" );
  });
  it( '#error', function() {
    var e = u$.error({
      message : "msg",
      a : "a",
      b : "not b"
    });
    assert.ok(e instanceof Error);
    assert.equal(e.toString(), 'msg {"a":"a","b":"not b"}');
    u$.error({
      b : "b",
      c : "c"
    }, e);
    assert.ok(e instanceof Error);
    assert.equal(e.toString(), 'msg {"a":"a","b":"b","c":"c"}');
    //
    //assert.equal(e.stack.split(/\n/)[0],
    //   "Error: msg  a:'a', b:'b', c:'c'");
  });
  it( '#parseDateUTC', function() {
    var isoDate = u$.parseDateUTC('2014-09-08 17:00:00');
    assert.equal('2014-09-08T17:00:00.000Z', u$.dateToIsoString(isoDate),isoDate.toString());
  });
  it( '#relativeDateString', function() {
    var s = u$.relativeDateString(
        u$.parseDateUTC('2014-09-08 17:00:00'),
        u$.parseDateUTC('2014-09-08 18:01:20'));
    assert.equal(s, '-01:01');
    s = u$.relativeDateString(
        u$.parseDateUTC('2014-09-08 18:01:20'),
        u$.parseDateUTC('2014-09-08 17:00:00')
    );
    assert.equal(s, '+01:01');
    s = u$.relativeDateString(
        u$.parseDateUTC('2014-09-08 18:01:20'),
        u$.parseDateUTC('2014-09-09 17:00:00')
    );
    assert.equal(s, '-22:59');
    s = u$.relativeDateString(
        u$.parseDateUTC('2014-09-08 18:01:20'),
        u$.parseDateUTC('2014-09-10 17:00:00')
    );
    assert.equal(s, '2014-09-08 18:01');
  });
  it( '#dateToIsoString', function() {
    var isoDate = u$.dateToIsoString(new Date(Date.UTC(1980, 0, 1)));
    assert.equal(isoDate, '1980-01-01T00:00:00.000Z');
    assert.equal(u$.dateToIsoString(new Date(isoDate)),
        '1980-01-01T00:00:00.000Z');
  });
  it( '#binarySearch', function() {
    var array = [ 1, 2, 4, 6, 8, 10, 25 ];
    function test(value, position) {
      var found = u$.binarySearch(value, array, t$.number.compare);
      assert.equal(found, position);
    }
    test(10, 5);
    test(25, 6);
    test(-1, -1);
    test(3, -3);
    test(5, -4);
    test(6, 3);
    test(7, -5);
    test(8, 4);
    test(9, -6);
    test(24, -7);
    test(26, -8);
    array.splice(5, 1);
    test(10, -6);
    test(25, 5);
    test(-1, -1);
    test(3, -3);
    test(5, -4);
    test(6, 3);
    test(7, -5);
    test(8, 4);
    test(9, -6);
    test(24, -6);
    test(26, -7);
  });
  it( '#brodcastCall', function() {
    var array = [ 'Nope', 'Nope' ];
    var one = {f:function(i){assert.equal(this,one);assert.equal(i,1);array[0]="1";}};
    var two = {f:function(i){assert.equal(this,two);assert.equal(i,1);array[1]="2";}};
    var three = {};
    u$.brodcastCall([one,two,three] ,"f",[1]);
    testArrays([ "1", "2" ], array);
  });
  it( '#isArrayEmpty', function() {
    var nope = [ 'Nope', 'Nope' ];
    assert.equal(u$.isArrayEmpty(nope),false);
    assert.equal(u$.isArrayEmpty([null]),false);
    assert.equal(u$.isArrayEmpty(null),true);
    assert.equal(u$.isArrayEmpty(undefined),true);
    assert.equal(u$.isArrayEmpty([]),true);
  });
  it( '#detectRepeatingChar', function() {
    assert.equal(u$.detectRepeatingChar("###abc","#"), 3);
  });
  it( '#detectPrefix', function() {
    assert.equal(u$.detectPrefix("{|abc","{|"), true);
  });
  it( '#repeat', function() {
    testArrays([ 0, 0, 0, 0 ], u$.repeat(4, 0));
    testArrays([ 1, 1, 1, 1 ], u$.repeat(4, 1));
  });

});

