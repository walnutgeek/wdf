var assert = require('assert');
var _ = require("lodash");

var WebPath = require("../WebPath");

var assert_error = require('./assert_error');

var s = [ 'hello','allo hello ale','helo','heLlo'];
var cases = [
  { r: "Rhel+o",
    b: [ true, true, true, false] },
  { r: "rhel+o",
    b: [ true, true, true, true] },
  { r: "R^hel+o$",
    b:  [ true, false, true, false] },
  { r: "r^hel+o$",
    b: [ true, false, true, true] },
  { r: "Shello",
    b: [ true, true, false, false] },
  { r: "shello",
    b: [ true, true, false, true] } ];

describe( 'WebPath',function() {
  it('.Search', function () {
    var Search = WebPath.Search;
    function test(r,b){
      var  s1 = new Search(r);
      for(var i = 0 ; i < s.length ; i++ ){
        assert.equal(b[i],s1.test(s[i]));
      }
      assert.equal(r,s1.toString());
    }
    for(var i = 0 ; i < cases.length ; i++ ){
      test(cases[i].r, cases[i].b);
    }
    try{
      new Search('X');
      assert.fail();
    }catch(e){
      assert_error(e,"Error: no such search type",
          "{\"type\":\"X\",\"allowed\":[\"R\",\"r\",\"S\",\"s\"]}");
    }
  });
  it('.Field', function () {
    var Field = WebPath.Field;
    function testAnd(prefix){
      for(var c1 = 0 ; c1 < cases.length ; c1++ ){
        for(var c2 = 0 ; c2 < cases.length ; c2++ ) {
          var r = 'A' + prefix + cases[c1].r + ',' + cases[c2].r ;
          var s1 = new Field( r );
          for (var i = 0; i < cases[c1].b.length; i++) {
            assert.equal(cases[c1].b[i] && cases[c2].b[i],
                s1.test(s[i]));
          }
          assert.equal(r, s1.toString());
        }
      }
    }
    function testOr(prefix){
      for(var c1 = 0 ; c1 < cases.length ; c1++ ){
        for(var c2 = 0 ; c2 < cases.length ; c2++ ) {
          var r = 'O' + prefix + cases[c1].r + ',' + cases[c2].r ;
          var s1 = new Field( r );
          for (var i = 0; i < cases[c1].b.length; i++) {
            assert.equal(cases[c1].b[i] || cases[c2].b[i],
                s1.test(s[i]));
          }
          assert.equal(r, s1.toString());
        }
      }
    }
    function testOne(prefix){
      var ops = ['A','O'] ;
      for(var c1 = 0 ; c1 < cases.length ; c1++ ){
        for(var j = 0 ; j < ops.length ; j++ ) {
          var r = ops[j] + prefix + cases[c1].r ;
          var s1 = new Field( r );
          for (var i = 0; i < cases[c1].b.length; i++) {
            assert.equal(cases[c1].b[i] , s1.test(s[i]));
          }
          assert.equal(r, s1.toString());
        }
      }
    }
    ['S','H','HA0','SD777'].forEach(function(prefix){
      testAnd(prefix);
      testOr(prefix);
      testOne(prefix);
    });
    var f = new Field('AS');
    assert.ok(f.test('slkdlksj kl dlsk'));
    assert.ok(_.isUndefined(f.toString()));
    f = new Field();
    assert.ok(f.test('slkdlksj kl dlsk'));
    assert.ok(_.isUndefined(f.toString()));
    f = new Field('ASSa,,a');
    assert.ok(f.test('ba,ab'));
    assert.equal(f.toString(),'ASSa,,a');
    try{
      new Field('X');
      assert.fail();
    }catch(e){
      assert_error(e,"Error: not allowed",
          "{\"provided\":\"X\",\"allowed\":[\"A\",\"O\"]}");
    }
  });
  it('.Params', function () {
    var Params = WebPath.Params;

    function testParams(p,test,tostr) {
      if(_.isUndefined(tostr)){
        tostr =  p ;
      }
      var params = new Params(p);
      for(var k in test){
        if(test.hasOwnProperty(k)){
          var strings = test[k];
          for(var s in strings){
            if(strings.hasOwnProperty(k)) {
              assert.equal(params[k].test(s),strings[s]);
            }
          }
        }
      }
      assert.equal(params.toString(), tostr);
    }

    testParams('q=ASSa%2C%2Ca',{q: {'a,a':true,'a,':false}});
    testParams('q=ASSa%2C%2Ca&O=OHSa%2CSb',
        {
          q: {'a,a':true,'a,':false},
          O: {'a':true,'b':true,' xbx ':true, 'xdfg':false},
        });
    testParams('q=AS',undefined,'');
    assert.equal('',new Params('').toString());
    assert.equal('',new Params().toString());

  });
  var path = new WebPath('/abc/o/x.csv?q=ASSa%2C%2Ca&O=OHSa%2CSb');
  it('.isRoot()', function () {
    assert.ok(!path.isRoot());
    assert.equal(path.name,'x.csv');
    assert.ok(!path.parent.isRoot());
    assert.equal(path.parent.name,'o');
    assert.ok(!path.parent.parent.isRoot());
    assert.equal(path.parent.parent.name,'abc');
    assert.ok(path.parent.parent.parent.isRoot());
    assert.equal(path.parent.parent.parent.name,'');
  });
  it('.extension()', function () {
    assert.equal('csv', path.extension());
    assert.equal('csv', path.extension());
    assert.equal('/', path.parent.extension());
    assert.equal('/', path.parent.extension());
    var bashrc = new WebPath('/abc/o/.bashrc').extension();
    assert.equal(null, bashrc );
    assert.equal(null, bashrc );
  });
  it('.enumerate()', function () {
    var e = path.enumerate();
    var paths = ['/', '/abc/', '/abc/o/', '/abc/o/x.csv'];
    var names = ['', 'abc', 'o', 'x.csv'];
    for( var i = 0 ; i < e.length ; i++ ){
      assert.equal(e[i].path(),paths[i]);
      assert.equal(e[i].path(),paths[i]);
      assert.equal(e[i].name,names[i]);
    }
  });
  it('all together', function () {
    assert.equal(path.path(),'/abc/o/x.csv');
    assert.equal(path.toString(),"/abc/o/x.csv?q=ASSa%2C%2Ca&O=OHSa%2CSb");
    assert.equal(new WebPath('/abc/o/x.csv').toString(),'/abc/o/x.csv');
    assert.equal(new WebPath('/abc/o').toString(),'/abc/o');
    assert.equal(new WebPath('/abc/o/').toString(),'/abc/o/');
  });
  it('ensurePath', function () {
    assert.ok(WebPath.ensurePath('/abc/o/x.csv') instanceof WebPath );
    assert.ok(WebPath.ensurePath(new WebPath('/abc/o/x.csv')) instanceof WebPath );
    assert.ok(WebPath.ensurePath(null) === null );
  });
  it('forbiden components', function () {
    function test_error(p){
      try{
        new WebPath(p);
        assert.fail();
      }catch(e){
        assert_error(e,'Error: path cannot include relative directory references',
            '{"input":"' + p + '"}');
      }
    }
    test_error('/../');
    test_error('/abc/../xyz/');
    test_error('./xyz/');

  });
  it('mime', function () {
    assert.equal(new WebPath('/a.xyz').mime(),'application/octet-stream' );
    assert.equal(new WebPath('/a.pdf').mime(),'application/pdf');
    assert.equal(new WebPath('/a.csv').mime(),'text/csv');
    assert.equal(new WebPath('/a/').mime(),'text/wdf');

  });
  it('child', function () {
    function test_error(p,c,i,m){
      try{
        new WebPath(p).child(c);
        assert.fail();
      }catch(e){
        if(i){
          assert_error(e,'Error: path cannot include relative directory references',
              '{"input":' + i + '}');
        }else{
          assert_error(e,m);
        }
      }
    }
    test_error('/b/','.','{"parent":{"name":"b","dir":true,"parent":{"name":"","dir":true,"parent":null}},"name":"."}');
    test_error('/b/','aa/kkk','{"parent":{"name":"b","dir":true,"parent":{"name":"","dir":true,"parent":null}},"name":"aa/kkk"}');
    test_error('/b','abc.xyz',undefined,'Error: only directory can have children');

    assert.equal(new WebPath('/b/').child('a.xyz').path(),'/b/a.xyz' );

  });

});