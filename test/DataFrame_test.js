
describe( 'wdf/DataFrame', function(){
  var DataFrame = require("../DataFrame");
  var u$ = require("../utils");
  var assert = require("assert");
  var smartAssert = require("./smart_assert");
  var _ = require("lodash");


  var rows = [{ abc: 1, cdx: 2},{ abc: 2, cdx: 3}];
  var config = {
    columns: ['abc','cdx']
  };
  var arrayRows = [
    [ 2 , null, '20150716'],
    [ 3 , 'x',  '20130710']
  ];
  var objectRows = [
    { a: 2 , d: '20150716'},
    { a: 3 ,b: 'x', d: '20130710'}
  ];

  var ALL_TYPES_WDF = require('./all_types_wdf');

  it( 'Initialization', function() {
    // jshint -W064 
    assert.ok( DataFrame(rows,config).constructor === DataFrame , 'Initialiesd wit hout new.' );
    // jshint +W064 
    assert.ok( new DataFrame(rows,config).constructor === DataFrame ,  'Initialiesd with new.' );
    assert.ok( new DataFrame(objectRows).constructor === DataFrame ,  'Initialiesd with new.' );
    try{
      new DataFrame('x');
      assert.fail("supposed to throw exception");
    }catch(e){
      assert.ok(true,'exception is thrown');
    }
  });
  it( 'arrayRows', function() {
    var df = new DataFrame(arrayRows);
    assert.equal( df.get(0,"c0") , 2  );
    assert.equal( df.get(0,"c1") , null );
    assert.equal( df.get(0,"c2") , '20150716' );
    assert.equal( df.get(1,"c0") , 3  );
    assert.equal( df.get(1,"c1") , 'x' );
    assert.equal( df.get(1,"c2") , '20130710' );
    var cols = df.columnSet.byIndex;
    assert.equal( cols[0].col_idx , 0);
    assert.equal( cols[0].name , 'c0');
    assert.equal( cols[1].col_idx , 1);
    assert.equal( cols[1].name , 'c1');
    assert.equal( cols[2].col_idx , 2);
    assert.equal( cols[2].name , 'c2');
    assert.equal( df.getRowCount() , 2 );
  });
  it( 'objectRows', function() {
    var df = new DataFrame(objectRows);
    assert.equal( df.get(0,"a") , 2  );
    assert.equal( df.get(0,"b") , undefined );
    assert.equal( df.get(0,"d") , '20150716' );
    assert.equal( df.get(1,"a") , 3  );
    assert.equal( df.get(1,"b") , 'x' );
    assert.equal( df.get(1,"d") , '20130710' );
    var cols = df.columnSet.byIndex;
    assert.equal( cols[0].col_idx , 0);
    assert.equal( cols[0].name , 'a');
    assert.equal( cols[1].col_idx , 1);
    assert.equal( cols[1].name , 'd');
    assert.equal( cols[2].col_idx , 2);
    assert.equal( cols[2].name , 'b');
    assert.equal( df.getRowCount() , 2 );
  });
  it( 'getter', function() {
    var df = new DataFrame(rows,config);
    assert.equal( df.get(0,"abc") , 1 ,  'get(0,abc)' );
    assert.equal( df.get(0,"cdx") , 2 ,  'get(0,cdx)' );
    assert.equal( df.get(1,"abc") , 2 ,  'get(1,abc)' );
    assert.equal( df.get(1,"cdx") , 3 ,  'get(1,cdx)' );
    assert.equal( df.get(0,0) , 1 ,  'get(0,0)' );
    assert.equal( df.get(0,1) , 2 ,  'get(0,1)' );
    assert.equal( df.get(1,0) , 2 ,  'get(1,0)' );
    assert.equal( df.get(1,1) , 3 ,  'get(1,1)' );
    assert.equal( df.getRowCount(), 2 ,  'simple counstructor test getter' );
  });
  it( 'getColumn', function() {
    var df = new DataFrame(objectRows);
    assert.deepEqual( df.getColumn("a") , [2,3]  );
    assert.deepEqual( df.getColumn("b") , [undefined,'x'] );
    assert.deepEqual( df.getColumn("d") , ['20150716','20130710'] );
    assert.deepEqual( df.getColumn("x") , undefined );
  });
  it( 'setColumnType', function() {
    var df = DataFrame.parse_wdf( ALL_TYPES_WDF );
    assert.deepEqual(df.getColumn("b"),[true,true,true,false,true,false,true]);
    df.setColumnType("b", "number");
    assert.deepEqual(df.getColumn("b"),[1,1,1,0,1,0,1]);
  });

  it( 'construct from scratch', function() {
    var df = new DataFrame();
    df.columnSet.enforceColumn("a");
    df.columnSet.enforceColumn("b");
    df.columnSet.enforceColumn("d");
    var i1 = df.newRow();
    var i2 = df.newRow();
    df.set(i1,"a",2);
    df.set(i2,"a",3);
    df.set(i2,"b",'x');
    df.set(i1,"d",'20150716');
    df.set(i2,"d",'20130710');
    assert.deepEqual( df.getColumn("a") , [2,3]  );
    assert.deepEqual( df.getColumn("b") , [undefined,'x'] );
    assert.deepEqual( df.getColumn("d") , ['20150716','20130710'] );
    df.deleteRow(0);
    assert.deepEqual( df.getColumn("a") , [3]  );
    var i3 = df.newRow();
    assert.equal(df.get(i3,'a'),undefined);

  });
  it( 'apply', function() {
    var df = DataFrame.parse_csv("abc,cdx\n1,2\n2,3\n");
    df.apply(function(rowidx){
      assert.deepEqual(this.getArrayRow(rowidx), rowidx ? ['2','3'] : ['1','2'] );
    });
  });
  it( 'map', function() {
    var df = DataFrame.parse_csv("abc,cdx\n1,2\n2,3\n");
    assert.deepEqual(df.map(function(rowidx){
      return rowidx ? undefined : this.get(rowidx,0);
    }),['1']);
  });
  it( 'deleteRow', function() {
    var df = DataFrame.parse_csv("abc,cdx\n1,2\n2,3\n");
    df.deleteRow(0);
    assert.deepEqual(df.getObjectRow(0),  {abc:'2',cdx:'3'} , 'getObjectRow' );
    assert.equal(df.getRowCount() ,  1);
    df.deleteRow(0);
    assert.equal(df.getRowCount() ,  0);
  });
  it( 'getData', function() {
    var df = DataFrame.parse_csv("abc,cdx\n1,2\n2,3\n");
    var columns = [{ "name": "abc" },  { "name": "cdx" } ];
    assert.deepEqual(df.getData(),  {  "config":{ "columns": columns}, "rows": [ [ "1","2"],["2","3"] ] }, 'getData' );
    df.deleteRow(0);
    assert.deepEqual(df.getData(),  { "config":{ "columns": columns}, "rows": [ [ "2", "3" ]]}, 'getData after delete' );
  });

  describe('SortCriteria', function () {
    it('constructor', function () {
      var sc = new DataFrame.SortCriteria([['a','A'],{name:'b',order:'D'}]);
      assert.equal(sc.parts[0].name,'a');
      assert.equal(sc.parts[1].name,'b');
      assert.equal(sc.parts[0].order,0);
      assert.equal(sc.parts[1].order,1);
    });
    it('sort', function () {
      var df = DataFrame.parse_wdf(require('./all_types_wdf'));
      var sc = new DataFrame.SortCriteria([['n','D'],['s']]);
      assert.equal(-1,df.columnSet.byName.n.type.compare(null,2));
      assert.equal(1,df.columnSet.byName.n.type.compare(2,undefined));
      assert.equal(-1,df.columnSet.byName.n.type.compare(1,25));
      assert.equal(1,df.columnSet.byName.n.type.compare(25,1));

      df.sort(sc);
      assert.equal(df.to_wdf(),
          '{"columns":[{"name":"s","type":"string"},{"name":"n","type":"number"},{"name":"b","type":"boolean"},{"name":"d","type":"date"},{"name":"dt","type":"datetime"},{"name":"ts","type":"timestamp"}]}\n'+
          '["hello",25,false,"2015-09-17","2015-09-17 17:18:19","2015-09-17 17:18:19.345"]\n'+
          '["hello",5,false,"2015-09-17","2015-09-17 17:18:19","2015-09-17 17:18:19.345"]\n'+
          '["hello",4,true,"2015-09-17","2015-09-17 17:18:19","2015-09-17 17:18:19.345"]\n'+
          '["hello",3,true,"2015-09-18","2015-09-17 17:18:19","2015-09-17 17:18:19.345"]\n'+
          '["ello",2,true,"2015-09-13",null,"2015-09-17 17:18:19.345"]\n'+
          '["hello",2,true,"2015-09-17","2015-09-17 17:18:19","2015-09-17 17:18:19.345"]\n'+
          '["",null,true,"2015-09-11","2015-09-17 17:18:19",null]\n');
    });

    it('find', function () {
      var df = DataFrame.parse_wdf(require('./all_types_wdf'));
      var sc = new DataFrame.SortCriteria([['d']]);
      df.sort(sc);
      assert.equal(1,df.find(sc,{d: new Date(Date.UTC(2015,8,13))}));

    });
  });

  describe('parse', function () {

    it( 'parse_csv', function() {
      var csv, df;
      csv = "abc,cdx\n1,2\n2,3\n" ;
      df = DataFrame.parse_csv(csv);
      assert.equal( df.get(0,"abc"), '1' ,  'get(0,abc)' );
      assert.equal( df.get(0,"cdx"), '2' ,  'get(0,cdx)' );
      assert.equal( df.get(1,"abc"), '2' ,  'get(1,abc)' );
      assert.equal( df.get(1,"cdx"), '3' ,  'get(1,cdx)' );
      assert.equal( df.getRowCount(), 2 ,  'simple case' );
      assert.equal(csv,df.to_csv());

      csv = 'abc,cdx\n1,"2\n2,3"\n' ;
      df = DataFrame.parse_csv(csv);
      assert.equal( df.get(0,"abc"), '1' ,  'get(0,abc)' );
      assert.equal( df.get(0,"cdx"), '2\n2,3' ,  'get(0,cdx)' );
      assert.equal( df.getRowCount(), 1 ,  'no header - quoted field' );
      assert.equal(csv,df.to_csv());

      csv = 'abc,cdx\n1,"2\n2,3"\n' ;
      df = DataFrame.parse_csv(csv,{columns:['a','c']});
      assert.equal( df.get(0,"a") , 'abc'  );
      assert.equal( df.get(0,"c") , 'cdx'  );
      assert.equal( df.get(1,"a") , '1'  );
      assert.equal( df.get(1,"c") , '2\n2,3' );
      assert.equal( df.getRowCount() , 2 ,  'header provided - quoted field' );
      assert.equal('a,c\nabc,cdx\n1,"2\n2,3"\n',df.to_csv());

      df = DataFrame.parse_csv('abc,cdx\n,"2\n2,3"\n',{columns:['a','c']});
      assert.equal( df.get(0,"a") , 'abc'  );
      assert.equal( df.get(0,"c") , 'cdx'  );
      assert.equal( df.get(1,"a") , ''  );
      assert.equal( df.get(1,"c") , '2\n2,3' );
      assert.equal( df.getRowCount() , 2 ,  'header provided - quoted field' );
      assert.equal('a,c\nabc,cdx\n,"2\n2,3"\n',df.to_csv());

      df = DataFrame.parse_csv('abc,cdx\n,"2\n""a""\n2,3"\n',{columns:['a','c']});
      assert.equal( df.get(0,"a") , 'abc'  );
      assert.equal( df.get(0,"c") , 'cdx'  );
      assert.equal( df.get(1,"a") , ''  );
      assert.equal( df.get(1,"c") , '2\n"a"\n2,3' );
      assert.equal( df.getRowCount() , 2 ,  'header provided - quoted field' );
      assert.equal('a,c\nabc,cdx\n,"2\n""a""\n2,3"\n',df.to_csv());

    });

    function assert_towdf(df) {
      var wdf_str = df.to_wdf();
      var lines = {
        orig: ALL_TYPES_WDF.split('\n'),
        to_wdf: wdf_str.split('\n')
      };
      for (var i = 0; i < lines.orig.length; i++) {
        assert.equal(lines.orig[i], lines.to_wdf[i]);
      }
      return wdf_str;
    }
    it( 'parse_wdf', function() {
      function test_df(df) {
        assert.equal(df.getRowCount(), 7);
        assert.equal(df.get(0, 'n'), 2);
        smartAssert(df.get(4, 1), NaN);
        smartAssert(df.get(6, 'ts'), new Date(Date.UTC(2015, 8, 17, 17, 18, 19, 345)));
        assert.equal(df.get(4, 'ts'), null);
        assert.equal(df.get(6, 'dt'), null);
      }
      var df = DataFrame.parse_wdf( ALL_TYPES_WDF );
      test_df(df);
      var wdf_str = assert_towdf(df);
      test_df(DataFrame.parse_wdf(wdf_str));
    });

    it( 'detectColumnTypes', function() {
      var df = DataFrame.parse_wdf( ALL_TYPES_WDF );
      df = DataFrame.parse_csv( df.to_csv() );
      var ts = df.getColumn('ts');
      var d = u$.detect_possible_array_types(ts);
      assert.deepEqual( ["s","n","b","d","dt","ts"], df.getColumnNames() );
      df.detectColumnTypes();
      assert_towdf(df);
    });

    it('parse_dom_table', function () {
      var dom_fragment = require("./dom_fragment");
      var dom = dom_fragment('<table>' +
          '<tr><th>col1</th><th>col2</th><th>col3</th></tr>' +
          '<tr><td>0 text 1</td><td>text 2</td><td>0</td></tr>' +
          '<tr><td>1 text 1</td><td>text 2</td><td>1</td></tr>' +
          '<tr><td>2 text 1</td><td>text 2</td><td>2</td></tr>' +
          '<tr><td>3 text 1</td><td>text 2</td><td>3</td></tr>' +
          '<tr><td>4 text 1</td><td>text 2</td><td>4</td></tr></table>').element;


      var df = DataFrame.parse_dom_table(dom);
      var array = df.getObjects();
      assert.equal(5,array.length);
      assert.deepEqual({col1:"0 text 1",col2:"text 2",col3:"0"}, array[0] );
      dom = dom_fragment("<table>" +
          "<thead><tr><th>col name 1</th><th>col name 2</th><th>col name 3</th></tr></thead>" +
          "<tbody>"+
          "<tr><td></td><td></td><td></td></tr>"+
          "<tr><td></td><td></td><td></td></tr>"+
          "<tr><td></td><td></td><td></td></tr>"+
          "<tr><td>ABC</td><td></td><td>52</td></tr>"+
          "<tr><td></td><td></td><td></td></tr>" +
          "</tbody>" +
          "</table>").element;
      df = DataFrame.parse_dom_table(dom);
      array = df.getObjects();
      assert.equal(5,array.length);
      assert.deepEqual({
        "col name 1":"ABC",
        "col name 2": "",
        "col name 3":"52"}, array[3] );
    });
    it('parse_json', function () {
      var e = u$.jail(
          function(){ DataFrame.parse_json('{}');}) ;
      assert.ok(e instanceof Error);
      e = u$.jail(
          function(){ DataFrame.parse_json('{');}) ;
      assert.equal(e,undefined);

      var df = new DataFrame();
      df.columnSet.enforceColumn("a");
      df.columnSet.enforceColumn("b");
      df.columnSet.enforceColumn("d");
      var i1 = df.newRow();
      var i2 = df.newRow();
      df.set(i1,"a",2);
      df.set(i2,"a",3);
      df.set(i2,"b",'x');
      df.set(i1,"d",'20150716');
      df.set(i2,"d",'20130710');
      var json = {"type":"DataFrame","config":{"columns":[{"name":"a"},{"name":"b"},{"name":"d"}]},"rows":[[2,null,"20150716"],[3,"x","20130710"]]};
      assert.deepEqual(df.to_json(), json) ;
      assert.equal(2,DataFrame.parse_json(json).getRowCount());
    });
    it('unknownTypesHandling_issue_10', function () {
      var df = DataFrame.parse_json(
          { type:"DataFrame",
            config:{ columns:[
              {name:"a",type: "unknown"},
              {name:"b"},
              {name:"d"}]},
            rows:[
              [2,null,"20150716"],
              [3,"x","20130710"]
            ]
          });
      assert.equal(df.columnSet.byName.a.type,undefined);
    });
    it('columnSet.getFormats', function () {
      var df = DataFrame.parse_wdf(require('./all_types_including_link'));
      var formats = df.columnSet.getFormats();
      assert.equal(7, _.size(formats));
      function testFormat(rowNum, col, actual, col_title) {
        col_title = col_title || col ;
        var col_idx = df.getColumnIndex(col);
        var v = df.get(rowNum, col_idx);
        assert.equal(actual, formats[col_idx].format(v));
        assert.equal(col_title, formats[col_idx].title);
      }
      testFormat(0, "s", "asr");
      testFormat(2, "s", "");
      testFormat(2, "l", '[hello z](/abc/z)');
      testFormat(4, "l", '');
      testFormat(4, "n", '');
      testFormat(3, "n", '5');
      testFormat(3, "d", "2015-09-17");
      testFormat(4, "ts", "");
      var reverse = function (s) {
        return s && s.split("").reverse().join("");
      };
      var just_text = function (l) {
        return l && l.text;
      };
      var just_href = function (l) {
        return l && l.href;
      };
      formats = df.columnSet.getFormats({
        format_fn: function (col_name, type_name, col) {
          if ('s' === col_name) {
            return reverse;
          }
        }
      });
      testFormat(0, "s", "rsa");
      testFormat(2, "s", "");
      testFormat(2, "l", '[hello z](/abc/z)');
      formats = df.columnSet.getFormats({
        format_fn: function (col_name, type_name, col) {
          if ('link' === type_name) {
            return just_text;
          }
        },
        title_fn: function(col_name){
          if(col_name=='s'){
            return "Column S";
          }
        }
      });
      testFormat(0, "s", "asr", "Column S");
      testFormat(2, "s", "",    "Column S");
      testFormat(2, "l", 'hello z');
      formats = df.columnSet.getFormats({by_names: {s: reverse}});
      testFormat(0, "s", "rsa");
      testFormat(2, "s", "");
      testFormat(2, "l", '[hello z](/abc/z)');
      formats = df.columnSet.getFormats({by_types: {link: just_text}});
      testFormat(0, "s", "asr");
      testFormat(2, "s", "");
      testFormat(2, "l", 'hello z');
      formats = df.columnSet.getFormats({by_names: {s: reverse},by_types: {link: just_text}});
      testFormat(0, "s", "rsa");
      testFormat(2, "s", "");
      testFormat(2, "l", 'hello z');
      testFormat(3, "d", "2015-09-17");
      formats = df.columnSet.getFormats({by_names: {s: reverse,l:just_href},by_types: {link: just_text}});
      testFormat(0, "s", "rsa");
      testFormat(2, "s", "");
      testFormat(2, "l", '/abc/z');
      testFormat(3, "d", "2015-09-17");
    });
  });

});
