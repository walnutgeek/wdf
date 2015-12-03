var assert = require('assert');
var _ = require("lodash");

function testArrays(expected, actual) {
  assert.equal(expected.length, actual.length );
  for ( var i = 0; i < expected.length; i++) {
    assert.equal(expected[i], actual[i]);
  }
}

var u$ = require("../wdf/utils");


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
  it( '#extractArray', function() {
    assert.deepEqual([], u$.extractArray());
  });
  it( '#combineKeyExtractors', function() {
    function a(){return 5;}
    assert.equal("a", u$.extractFunctionName(a));
    function $_a(){return 5;}
    assert.equal("$_a", u$.extractFunctionName($_a));
    var len = u$.combineKeyExtractors(['len','size']
        .map(u$.getPropertyExtractor)) ;
    assert.equal(3,len({size: 3}));
    assert.equal(5,len({len: 5}));
    assert.equal(undefined,len(a));
    assert.deepEqual({a:a,$_a:$_a},
        u$.convertListToObject([a,$_a],u$.extractFunctionName) )
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
      var found = u$.binarySearch(value, array, u$.types.number.compare);
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
  it( '#parse_date', function() {
    function test(to_s,to_d,s){
      assert.equal(s,to_s(to_d(s)));
    }

    var to_utc_s = u$.date_to_string_fn("YYYY_MM_DD_hh_mm_ss",u$.utc_components);
    test(to_utc_s,u$.parseDateUTC, "2015-12-31 23:59:59");
    var to_local_s = u$.date_to_string_fn("YYYY_MM_DD_hh_mm_ss",u$.date_components);
    test(to_local_s,u$.parseDate, "2015-12-31 23:59:59");

  });
  it( '#testFor', function() {
    try{
      u$.testFor('','any',[]);
      assert.fail('not supposed to get here');
    }catch(e){
      assert.equal("Unexpected value {\"expected\":[\"some\",\"every\"],\"provided\":\"any\"}",
          e.toString());
    }
    var values = [
      undefined, null, 0, 1, 1.5, " ", "", "a",
      new Date, false, true, function(){}, {x:0} ,[1] ];

    function test(f,condition,predicates){
      values.forEach(function(v){
        assert.equal(u$.testFor(v,condition,predicates),f(v));
      });
    }

    test(u$.isNullish,'some',[_.isNull, _.isUndefined]);
    test(u$.isPrimitive,'some',
        [_.isString, _.isNumber, _.isBoolean,
          _.isFunction, _.isDate] );
    test(u$.isStringEmpty,'some', [u$.isNullish,
      function(s){return _.isString(s) && s.trim().length === 0;}]);

  });
  it( '#isInteger', function() {
    assert.ok(u$.isInteger(1));
    assert.ok(u$.isInteger(-1));
    assert.ok(!u$.isInteger(-7.00000000000001),"7.......");
  });
});

describe( 'wdf/utils.Type',function(){

  it('Sort & Order', function() {
    var cmp = u$.types.string.compare;
    assert.equal(cmp(undefined,null),-1);
    assert.equal(cmp(null,undefined),1);
    assert.equal(cmp(null,'z'),-1);
    assert.equal(cmp('z',null),1);
    assert.equal(cmp(undefined,'z'),-1);
    assert.equal(cmp('z', undefined),1);
    assert.equal(cmp('z','a'),1);
    assert.equal(cmp('a','z'),-1);
    var array = ['a',null,undefined,'z','r',undefined ] ;
    var index = u$.createIndex(array);
    assert.deepEqual(array,['a',null,undefined,'z','r',undefined ],'sanity');
    assert.deepEqual(index,[0,1,2,3,4,5 ] , 'index');
    index.sort(u$.indexOrder(cmp,array));
    assert.deepEqual(u$.extractValuesByIndex(index,array),[ undefined, undefined, null, "a", "r", "z" ],'check order');
    assert.deepEqual(index,[ 2, 5, 1, 0, 4, 3 ],'check index');
    assert.deepEqual(array,['a',null,undefined,'z','r',undefined ],'original array unchanged');
  });

  it('types[*].from_string', function() {
    var cases = {
      string : {
        positive: {'' : null, 'a' : 'a', '3' : '3' },
        negative: []
      },
      number : {
        positive: {
          '' : NaN, 'NaN': NaN, '3' : 3, '0' : 0,
          '0x15' : 21, '1e8' : 1e8, 'null' : NaN },
        negative: ['3a', 's']
      },
      boolean : {
        positive: {
          '' : null, 'null': null, '1' : true, '0' : false,
          'Y' : true, 'true' : true, 'no' : false },
        negative: ['3a', 's' , '5', '2.7']
      },
      date : {
        positive: {
          '2015-09-15T17:00:14' : new Date(Date.UTC(2015,8,15,17,0,14)),
          '2015-09-15 17:00:14' : new Date(Date.UTC(2015,8,15,17,0,14)),
          '2015-09-15' : new Date(Date.UTC(2015,8,15,0,0,0)),
          '20150915' : new Date(Date.UTC(2015,8,15,0,0,0)),  },
        '20150915170014' : new Date(Date.UTC(2015,8,15,17,0,14)),
        '20150915-170014' : new Date(Date.UTC(2015,8,15,17,0,14)),
        negative: ['3a', 's' , '5', '2.7']
      },
      datetime : {
        positive: {
          '2015-09-15T17:00:14' : new Date(Date.UTC(2015,8,15,17,0,14)),
          '2015-09-15 17:00:14' : new Date(Date.UTC(2015,8,15,17,0,14)),
          '2015-09-15' : new Date(Date.UTC(2015,8,15,0,0,0)),
          '20150915' : new Date(Date.UTC(2015,8,15,0,0,0)),  },
        '20150915170014' : new Date(Date.UTC(2015,8,15,17,0,14)),
        '20150915-170014' : new Date(Date.UTC(2015,8,15,17,0,14)),
        negative: ['3a', 's' , '5', '2.7']
      },
    };
    var input, out, expected, msg ;
    for(var t in  cases){
      for(input in cases[t].positive){
        out=u$.types[t].from_string(input);
        expected = cases[t].positive[input];
        msg = t+' in:'+input+' expected:'+expected;
        if( !isNaN(expected) ){
          if(_.isDate(expected) && _.isDate(out)){
            assert.equal(out.valueOf(), expected.valueOf(), msg );
          }else{
            assert.equal(out, expected,msg );
          }
        }else{
          assert.ok( isNaN(out), msg);
        }
      }
      for(var i in cases[t].negative){
        input = cases[t].negative[i] ;
        out = u$.types[t].from_string(input) ;
        msg =  t+' in:'+input+' should be undefined:'+out ;
        assert.ok( undefined === out, msg);
      }
    }

  });
  it('types[*].to_string', function() {
    var cases = {
      string : [ [null , ''], ['a' , 'a'], [ '3' , '3'] ],
      number : [ [ NaN,''],[3,'3'],[null,''],[1e8,'100000000']],
      boolean : [ [true,'true'],[false,'false'],[null,'']],
      date : [[new Date(Date.UTC(2015,8,15,17,0,14)),'2015-09-15'],[null,'']],
      datetime : [[new Date(Date.UTC(2015,8,15,17,0,14)),'2015-09-15 17:00:14'],[null,'']],
    };
    var input, out, expected, msg ;
    for(var t in  cases){
      for(var i in cases[t]){
        input = cases[t][i][0];
        out=u$.types[t].to_string(input);
        expected = cases[t][i][1];
        msg = t+' in:'+input+' expected:'+expected;
        assert.equal(out, expected,msg );
      }
    }

//    var x = '2015-09-15T17:00:14';
//    assert.equal(moment(x).format('YYYY-MM-DDTHH:mm:ss'),x);
  });
});

