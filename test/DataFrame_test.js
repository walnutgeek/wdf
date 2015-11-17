describe( 'wdf/DataFrame', function(){
  var DataFrame = require("../wdf/DataFrame");
  var assert = require("assert");

  var rows = [{ abc: 1, cdx: 2},{ abc: 2, cdx: 3}];
  var columns = ['abc','cdx'];
  var arrayRows = [
    [ 2 , null, '20150716'],
    [ 3 , 'x',  '20130710']
  ];
  var objectRows = [
    { a: 2 , d: '20150716'},
    { a: 3 ,b: 'x', d: '20130710'}
  ];
  it( 'Initialization', function() {
    // jshint -W064 
    assert.ok( DataFrame(rows,columns).constructor === DataFrame , 'Initialiesd wit hout new.' );
    // jshint +W064 
    assert.ok( new DataFrame(rows,columns).constructor === DataFrame ,  'Initialiesd with new.' );
    assert.ok( new DataFrame(objectRows).constructor === DataFrame ,  'Initialiesd with new.' );

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
    var df = new DataFrame(rows,columns);
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
  it( 'parse_csv', function() {
    var df = DataFrame.parse_csv("abc,cdx\n1,2\n2,3\n");
    assert.equal( df.get(0,"abc"), '1' ,  'get(0,abc)' );
    assert.equal( df.get(0,"cdx"), '2' ,  'get(0,cdx)' );
    assert.equal( df.get(1,"abc"), '2' ,  'get(1,abc)' );
    assert.equal( df.get(1,"cdx"), '3' ,  'get(1,cdx)' );
    assert.equal( df.getRowCount(), 2 ,  'simple case' );

    var df2 = DataFrame.parse_csv('abc,cdx\n1,"2\n2,3"\n');
    assert.equal( df2.get(0,"abc"), '1' ,  'get(0,abc)' );
    assert.equal( df2.get(0,"cdx"), '2\n2,3' ,  'get(0,cdx)' );
    assert.equal( df2.getRowCount(), 1 ,  'no header - quoted field' );
    var df3 = DataFrame.parse_csv('abc,cdx\n1,"2\n2,3"\n',['a','c']);
    assert.equal( df3.get(0,"a") , 'abc'  );
    assert.equal( df3.get(0,"c") , 'cdx'  );
    assert.equal( df3.get(1,"a") , '1'  );
    assert.equal( df3.get(1,"c") , '2\n2,3' );
    assert.equal( df3.getRowCount() , 2 ,  'header provided - quoted field' );
    var df4 = DataFrame.parse_csv('abc,cdx\n,"2\n2,3"\n',['a','c']);
    assert.equal( df4.get(0,"a") , 'abc'  );
    assert.equal( df4.get(0,"c") , 'cdx'  );
    assert.equal( df4.get(1,"a") , ''  );
    assert.equal( df4.get(1,"c") , '2\n2,3' );
    assert.equal( df4.getRowCount() , 2 ,  'header provided - quoted field' );

  });
  it( 'getColumn', function() {
    var df = new DataFrame(objectRows);
    assert.deepEqual( df.getColumn("a") , [2,3]  );
    assert.deepEqual( df.getColumn("b") , [undefined,'x'] );
    assert.deepEqual( df.getColumn("d") , ['20150716','20130710'] );
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
  });
  it( 'apply', function() {
    var df = DataFrame.parse_csv("abc,cdx\n1,2\n2,3\n");
    df.apply(function(df,rowidx){
      assert.deepEqual(df.getRow(rowidx,[]), rowidx ? ['2','3'] : ['1','2'] );
    });
  });
  it( 'deleteRow', function() {
    var df = DataFrame.parse_csv("abc,cdx\n1,2\n2,3\n");
    df.deleteRow(0);
    assert.deepEqual(df.getRow(0),  {abc:'2',cdx:'3'} , 'getRow' );
    assert.equal(df.getRowCount() ,  1);
    df.deleteRow(0);
    assert.equal(df.getRowCount() ,  0);
  });
  it( 'getData', function() {
    var df = DataFrame.parse_csv("abc,cdx\n1,2\n2,3\n");
    var columns = [{ "name": "abc" },  { "name": "cdx" } ];
    assert.deepEqual(df.getData(),  {  "columns": columns, "rows": [ [ "1","2"],["2","3"] ] }, 'getData' );
    df.deleteRow(0);
    assert.deepEqual(df.getData(),  { "columns":  columns, "rows": [ [ "2", "3" ]]}, 'getData after delete' );
  });
});
