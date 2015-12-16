var assert = require('assert');
var _ = require("lodash");

function testArrays(expected, actual) {
  assert.equal(expected.length, actual.length );
  for ( var i = 0; i < expected.length; i++) {
    assert.equal(expected[i], actual[i]);
  }
}

var u$ = require("../wdf/utils");


function smartAssert(expected, result, msg) {
  if (isNaN(expected)){
    assert.ok(isNaN(result), msg);
  } else if (_.isDate(expected)){
    var r = result && result.valueOf();
    var e =expected.valueOf() ;
    assert.equal(e, r, msg + ' e:'+e+ ' r:'+r);
  } else {
    assert.equal(result, expected, msg);

  }
}

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
        u$.convertListToObject([a,$_a],u$.extractFunctionName) );
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
    assert.equal('2014-09-08T17:00:00.000Z', isoDate.toISOString(),isoDate.toString());
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
    var isoDate = new Date(Date.UTC(1980, 0, 1)).toISOString();
    assert.equal(isoDate, '1980-01-01T00:00:00.000Z');
    assert.equal(new Date(isoDate).toISOString(),
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
      new Date(), false, true, function(){}, {x:0} ,[1] ];

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
  it( '#isUint32', function() {
    assert.ok(u$.isUint32(1));
    assert.ok(!u$.isUint32(-1));
    assert.ok(!u$.isUint32(-7.00000000000001),"7.......");
    assert.ok(u$.isUint32(0xffffffff));
    assert.ok(!u$.isUint32(0x100000000));
  });

  describe( 'types',function(){

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
            'Y' : true, 'true' : true, 'no' : false ,
            '.0001':true , '2.7':true, '5':true, '1e-10':false },
          negative: ['3a', 's' ],
          positive_strict: {
            '' : null, 'null': null, '1' : true, '0' : false,
            'Y' : true, 'true' : true, 'no' : false },
          negative_strict: ['3a', 's' , '5', '2.7']
        },
        date : {
          positive_strict: {
            '' : null ,
            '2015-09-15' : new Date(Date.UTC(2015,8,15,0,0,0)),
            '20150915' : new Date(Date.UTC(2015,8,15,0,0,0)),
          },
          negative_strict: ['3a', 's' , '5', '2.7', '2015-09-15T17:00:14','2015-09-15 17:00:14'],
          positive: {
            '' : null ,
            '2015-09-15' : new Date(Date.UTC(2015,8,15,0,0,0)),
            '20150915' : new Date(Date.UTC(2015,8,15,0,0,0)),
            '20150915170014' : new Date(Date.UTC(2015,8,15)),
            '20150915-170014' : new Date(Date.UTC(2015,8,15)),
          },
          negative: ['3a', 's' , '5', '2.7']
        },
        datetime : {
          positive_strict: {
            '2015-09-15T17:00:14' : new Date(Date.UTC(2015,8,15,17,0,14)),
            '2015-09-15 17:00:14' : new Date(Date.UTC(2015,8,15,17,0,14)),
            '2015-09-15' : new Date(Date.UTC(2015,8,15,0,0,0)),
            '20150915' : new Date(Date.UTC(2015,8,15,0,0,0)),
            '20150915170014' : new Date(Date.UTC(2015,8,15,17,0,14)),
            '20150915-170014' : new Date(Date.UTC(2015,8,15,17,0,14)),},
          negative_strict: ['3a', 's' , '5', '2.7', '2015-09-15T17:00:14.023Z' ,'2015-09-15T17:00:14.023' ],
          positive: {
            '2015-09-15T17:00:14' : new Date(Date.UTC(2015,8,15,17,0,14)),
            '2015-09-15 17:00:14' : new Date(Date.UTC(2015,8,15,17,0,14)),
            '2015-09-15' : new Date(Date.UTC(2015,8,15,0,0,0)),
            '20150915' : new Date(Date.UTC(2015,8,15,0,0,0)),
            '20150915170014' : new Date(Date.UTC(2015,8,15,17,0,14)),
            '2015-09-15 17:00:14.345' : new Date(Date.UTC(2015,8,15,17,0,14)),},
          negative: ['3a', 's' , '5', '2.7' ,'2015-09-15-17:00:14.345']
        },
        timestamp : {
          positive: {
            '2015-09-15T17:00:14' : new Date(Date.UTC(2015,8,15,17,0,14)),
            '2015-09-15 17:00:14' : new Date(Date.UTC(2015,8,15,17,0,14)),
            '2015-09-15' : new Date(Date.UTC(2015,8,15,0,0,0)),
            '20150915' : new Date(Date.UTC(2015,8,15,0,0,0)),
            '20150915170014' : new Date(Date.UTC(2015,8,15,17,0,14)),
            '20150915-170014' : new Date(Date.UTC(2015,8,15,17,0,14)),
            '2015-09-15T17:00:14.023' : new Date(Date.UTC(2015,8,15,17,0,14,23)),
            '2015-09-15T17:00:14.023Z' : new Date(Date.UTC(2015,8,15,17,0,14,23)), },
          negative: ['3a', 's' , '5', '2.7']
        },
      };
      var input, out, expected, msg ;

      function test_fromstring(t,strict) {
        var c = cases[t];
        var suffix = strict ? '_strict' : '';
        var positive_cases = c['positive'+suffix];
        var negative_cases = c['negative'+suffix];
        for (input in positive_cases) {
          out = u$.types[t].from_string(input, strict);
          expected = positive_cases[input];
          msg = t + suffix + ' in:' + input + ' expected:' + expected;
          smartAssert(expected, out, msg);
        }
        for (var i in negative_cases) {
          input = negative_cases[i];
          out = u$.types[t].from_string(input, strict);
          msg = t +suffix+ ' in:' + input + ' should be undefined:' + out;
          assert.ok(undefined === out, msg);
        }
      }

      //test_fromstring('datetime',false);
      for(var t in  cases){
        test_fromstring(t,false);
        test_fromstring(t,true);
      }

    });
    it('types[*].to_string', function() {
      var cases = {
        string : [ [null , ''], ['a' , 'a'], [ '3' , '3'] ],
        number : [ [ NaN,''],[3,'3'],[null,''],[1e8,'100000000']],
        boolean : [ [true,'true'],[false,'false'],[null,'']],
        date : [ [new Date(Date.UTC(2015,8,15,17,0,14)),'2015-09-15'],[null,""]],
        datetime : [ [new Date(Date.UTC(2015,8,15,17,0,14)),'2015-09-15 17:00:14'],[null,""]],
        timestamp : [ [new Date(Date.UTC(2015,8,15,17,0,14,134)),'2015-09-15 17:00:14.134'],[null,""]],
      };
      var input, out, expected, msg ;
      for(var t in  cases){
        for(var i in cases[t]){
          input = cases[t][i][0];
          out = u$.types[t].to_string(input);
          expected = cases[t][i][1];
          msg = t+' result:'+out+' expected:'+expected;
          assert.equal(out, expected, msg );
        }
      }

//    var x = '2015-09-15T17:00:14';
//    assert.equal(moment(x).format('YYYY-MM-DDTHH:mm:ss'),x);
    });
  });
  describe('detect_possible_array_types', function() {
    function matchArrays(a,b){
      assert.ok(_.isArray(a));
      assert.ok(_.isArray(b));
      assert.equal(a.length,b.length);
      for(var i = 0 ; i < a.length ; i++){
        smartAssert( a[i], b[i], JSON.stringify([a[i],b[i]]) );
      }
    }
    function match(a,b,selected){
      assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort());
      Object.keys(a).forEach(function(k){
        assert.equal(a[k].hasMissing,b[k].hasMissing);
        matchArrays(a[k].array,b[k].array);
      });
      assert.equal(u$.choose_column_type(b).type.name,selected);
    }

    describe('has missing', function() {
      it('number', function() {

        match(  {
              string:{ array:['5','0',''],hasMissing:true},
              number:{ array:[5,0,NaN],hasMissing:true},
            },
            u$.detect_possible_array_types(['5','0',''] ),
            'number');
      });
      it('number and boolean', function() {
        match(  {
              string:{ array:['1','0',''],hasMissing:true},
              boolean:{ array:[true,false,null],hasMissing:true},
              number:{ array:[1,0,NaN],hasMissing:true},
            },
            u$.detect_possible_array_types(['1','0',''] ),
            'number');
      });
      it('date', function() {
        match(  {
              string:{ array:['1994-10-17','2015-02-03',''],hasMissing:true},
              date:{ array:[ new Date(Date.UTC(1994,9,17)),new Date(Date.UTC(2015,1,3)),null],hasMissing:true},
              datetime:{ array:[new Date(Date.UTC(1994,9,17)),new  Date(Date.UTC(2015,1,3)),null],hasMissing:true},
            },
            u$.detect_possible_array_types(['1994-10-17','2015-02-03',''] ),
            'date');
      });
      it('string', function() {
        match(  {
              string:{ array:['1994-10-17','2015',''],hasMissing:true},
            },
            u$.detect_possible_array_types(['1994-10-17','2015',''] ),
            'string');
      });
    });

    describe('no missing', function() {
      it('number', function() {
        match(  {
              string:{ array:['5','0'],hasMissing:false},
              number:{ array:[5,0],hasMissing:false},
            },
            u$.detect_possible_array_types(['5','0'] ),'number');
      });
      it('number and boolean', function() {
        match(  {
              string:{ array:['1','0'],hasMissing:false},
              boolean:{ array:[true,false],hasMissing:false},
              number:{ array:[1,0],hasMissing:false},
            },
            u$.detect_possible_array_types(['1','0'] ),'number');
      });
      it('date', function() {
        match(  {
              string:{ array:['1994-10-17','2015-02-03'],hasMissing:false},
              date:{ array:[ new Date(Date.UTC(1994,9,17)),new Date(Date.UTC(2015,1,3))],hasMissing:false},
              datetime:{ array:[new Date(Date.UTC(1994,9,17)),new  Date(Date.UTC(2015,1,3))],hasMissing:false},
            },
            u$.detect_possible_array_types(['1994-10-17','2015-02-03'] ),'date');
      });
      it('datetime', function() {
        match(  {
              string:{ array:['1994-10-17','2015-02-03'],hasMissing:false},
              datetime:{ array:[new Date(Date.UTC(1994,9,17,17,3,5)),new  Date(Date.UTC(2015,1,3))],hasMissing:false},
            },
            u$.detect_possible_array_types(['1994-10-17 17:03:05','2015-02-03']),'datetime');
      });
      it('datetime number', function() {
        match(  {
              string:{ array:['19941017170305','20150203'],hasMissing:false},
              number:{ array:[19941017170305,20150203],hasMissing:false},
              datetime:{ array:[new Date(Date.UTC(1994,9,17,17,3,5)),new  Date(Date.UTC(2015,1,3))],hasMissing:false},
            },
            u$.detect_possible_array_types(['19941017170305','20150203']), 'number');
      });
      it('string', function() {
        match(  {
              string:{ array:['1994-10-17','2015'],hasMissing:false},
            },
            u$.detect_possible_array_types(['1994-10-17','2015'] ),'string');
      });
    });
  });
  it('types.coerce', function() {
    var cases = {
      string: {
        number: [[null, NaN], ['a', undefined], ['3', 3]],
        boolean: [[null, null],['',null], ['0',false],
          ['1',true], ['n',false],['Y',true],['yes',true],['true',true],
          ['yada sddfs',null],['nada sddfs',null]],
        date: [[null,null],['flkdjflk',undefined],
          ['1995-12-17',new Date(Date.UTC(1995,11,17))],
          ['1995-12-17 18:30:45',new Date(Date.UTC(1995,11,17))],
        ],
        datetime: [[null,null],['flkdjflk',undefined],
          ['1995-12-17',new Date(Date.UTC(1995,11,17))],
          ['1995-12-17 18:30:45',new Date(Date.UTC(1995,11,17,18,30,45))],
          ['1995-12-17 18:30:45.345',new Date(Date.UTC(1995,11,17,18,30,45))],
        ],
        timestamp: [[null,null],['flkdjflk',undefined],
          ['1995-12-17',new Date(Date.UTC(1995,11,17))],
          ['1995-12-17 18:30:45',new Date(Date.UTC(1995,11,17,18,30,45))],
          ['1995-12-17 18:30:45.345',new Date(Date.UTC(1995,11,17,18,30,45,345))],
        ]
      },
      number: {
        string: [[NaN, ''], [5, '5'], [null, '']],
        boolean: [[null, null],[1,true], [0,false], [0.5,true],[NaN,null]],
        date: [[null,null],[NaN,null],
          [Date.UTC(2015,7,17), new Date(Date.UTC(2015,7,17))],
          [Date.UTC(2015,7,17,12,5,13), new Date(Date.UTC(2015,7,17))],
          [Date.UTC(2015,7,17,12,5,13,345), new Date(Date.UTC(2015,7,17))],
        ],
        datetime: [[null,null],[NaN,null],
          [Date.UTC(2015,7,17), new Date(Date.UTC(2015,7,17))],
          [Date.UTC(2015,7,17,12,5,13), new Date(Date.UTC(2015,7,17,12,5,13))],
          [Date.UTC(2015,7,17,12,5,13,345), new Date(Date.UTC(2015,7,17,12,5,13))],
        ],
        timestamp: [[null,null],[NaN,null],
          [Date.UTC(2015,7,17), new Date(Date.UTC(2015,7,17))],
          [Date.UTC(2015,7,17,12,5,13), new Date(Date.UTC(2015,7,17,12,5,13))],
          [Date.UTC(2015,7,17,12,5,13,345), new Date(Date.UTC(2015,7,17,12,5,13,345))],
        ]
      },
      boolean: {
        string: [[null, ''], [false, 'false'], [true, 'true']],
        number: [[null, NaN],[true,1], [false,0], ],
        date: [[null,null],[false,null],[true,null]],
        datetime: [[null,null],[false,null],[true,null]],
        timestamp: [[null,null],[false,null],[true,null]]
      },
      date: {
        string: [[null, ''],[new Date(Date.UTC(2015,8,15)), '2015-09-15']] ,
        number: [[null, NaN],[new Date(Date.UTC(2015,8,15)), Date.UTC(2015,8,15) ]] ,
        boolean: [[null,null],[new Date(Date.UTC(2015,8,15)),null]],
        datetime: [[null,null],[new Date(Date.UTC(2015,8,15)),new Date(Date.UTC(2015,8,15))]],
        timestamp: [[null,null],[new Date(Date.UTC(2015,8,15)),new Date(Date.UTC(2015,8,15))]]
      },
      datetime: {
        string: [[null, ''],[new Date(Date.UTC(2015,8,15,17,22,42)), '2015-09-15 17:22:42']] ,
        number: [[null, NaN],[new Date(Date.UTC(2015,8,15,17,22,42)), Date.UTC(2015,8,15,17,22,42) ]] ,
        boolean: [[null,null],[new Date(Date.UTC(2015,8,15,17,22,42)),null]],
        date: [[null,null],[new Date(Date.UTC(2015,8,15,17,22,42)),new Date(Date.UTC(2015,8,15))]],
        timestamp: [[null,null],[new Date(Date.UTC(2015,8,15,17,22,42)),new Date(Date.UTC(2015,8,15,17,22,42))]]
      },
      timestamp: {
        string: [[null, ''],[new Date(Date.UTC(2015,8,15,17,22,42,432)), '2015-09-15 17:22:42.432']] ,
        number: [[null, NaN],[new Date(Date.UTC(2015,8,15,17,22,42,432)), Date.UTC(2015,8,15,17,22,42,432) ]] ,
        boolean: [[null,null],[new Date(Date.UTC(2015,8,15,17,22,42,432)),null]],
        date: [[null,null],[new Date(Date.UTC(2015,8,15,17,22,42,432)),new Date(Date.UTC(2015,8,15))]],
        datetime: [[null,null],[new Date(Date.UTC(2015,8,15,17,22,42,432)),new Date(Date.UTC(2015,8,15,17,22,42))]]
      },
      unknown:{
        string: [[null, ''],[new Date(Date.UTC(2015,8,15,17,22,42,432)), '2015-09-15 17:22:42.432']] ,
        number: [[null, NaN],[new Date(Date.UTC(2015,8,15,17,22,42,432)), Date.UTC(2015,8,15,17,22,42,432) ]] ,
        boolean: [[null,null],[new Date(Date.UTC(2015,8,15,17,22,42,432)),null]],
        date: [[null,null],[new Date(Date.UTC(2015,8,15,17,22,42,432)),new Date(Date.UTC(2015,8,15))]],
        datetime: [[null,null],[new Date(Date.UTC(2015,8,15,17,22,42,432)),new Date(Date.UTC(2015,8,15,17,22,42))]],
        timestamp: [[null,null],[new Date(Date.UTC(2015,8,15,17,22,42,432)),new Date(Date.UTC(2015,8,15,17,22,42,432))]]
      }
    };

    function test_coerceFromTo(tf,tt) {
      var input, result, expected, msg;
      var type_from = u$.types[tf];
      var type_to = u$.types[tt];
      var from_to = tf + '->' + type_to.name;
      for (var i in cases[tf][tt]) {
        var c = cases[tf][tt][i];
        input = c[0];
        result = type_to.coerce(input, type_from);
        expected = c[1];
        msg = from_to + ' input:'+input+' result:' + result + ' expected:' + expected;
        smartAssert(expected, result, msg);
      }
    }
    //test_coerceFromTo('unknown','boolean');
    for(var tf in  cases){
      for(var tt in cases[tf]) {
        test_coerceFromTo(tf,tt);
      }
    }
  });
  it('findTypeByValue',function(){
    function test_find(v, typeName) {
      assert.equal(u$.findTypeByValue(v).name, typeName);
    }
    test_find(null, 'string');
    test_find(new Date(Date.UTC(2015,8,15,17,22,42,432)), 'timestamp');
    test_find(new Date(Date.UTC(2015,8,15,17,22,42)), 'datetime');
    test_find(new Date(Date.UTC(2015,8,15)), 'date');
    test_find('2015-09-15', 'string');
    test_find('ddll', 'string');
    test_find(NaN, 'number');
    test_find(false, 'boolean');
    test_find(undefined, 'string');
    test_find(3, 'number');
  });
});


