var assert = require('assert');
var _ = require("lodash");

describe( 'wdf/types',function(){
  var t$ = require("../wdf/types");

  it('Sort & Order', function() {
    var cmp = t$.string.compare;
    assert.equal(cmp(undefined,null),-1);
    assert.equal(cmp(null,undefined),1);
    assert.equal(cmp(null,'z'),-1);
    assert.equal(cmp('z',null),1);
    assert.equal(cmp(undefined,'z'),-1);
    assert.equal(cmp('z', undefined),1);
    assert.equal(cmp('z','a'),1);
    assert.equal(cmp('a','z'),-1);
    var array = ['a',null,undefined,'z','r',undefined ] ;
    var index = t$.createIndex(array);
    assert.deepEqual(array,['a',null,undefined,'z','r',undefined ],'sanity');
    assert.deepEqual(index,[0,1,2,3,4,5 ] , 'index');
    index.sort(t$.indexOrder(cmp,array));
    assert.deepEqual(t$.extractValuesByIndex(index,array),[ undefined, undefined, null, "a", "r", "z" ],'check order');
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
        out=t$[t].from_string(input);
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
        out = t$[t].from_string(input) ;
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
        out=t$[t].to_string(input);
        expected = cases[t][i][1];
        msg = t+' in:'+input+' expected:'+expected;
        assert.equal(out, expected,msg );
      }
    }

//    var x = '2015-09-15T17:00:14';
//    assert.equal(moment(x).format('YYYY-MM-DDTHH:mm:ss'),x);
  });
});
