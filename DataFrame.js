// ## Private stuff
//
// methods and classes that not supposed to be used directly
(function() {
  "use strict";

  var u$ = require("./utils");
  var _ = require("lodash");

// `Column` has `name`. Also `data` array is there to store all column's value.
// Optionally if `type` defined when all `data` assumed to be casted to that type (
// See [type](types.html) ). Also `col_idx` point on this column in column set.

  var Column = function (name, len, type) {
    this.name = name;
    this.data = [];
    if (len) {
      this.data.length = len;
    }
    this.setType(type,false);
  };

  Column.prototype.coerceData = function(from_type){
    for(var row = 0 ; row < this.data.length ; row++ ){
      this.data[row] = this.type.coerce(this.data[row],from_type);
    }
  };

  Column.prototype.detectData = function(){
    if( u$.isNullish(this.type) || this.type.name === "string" ){
      var options = u$.detect_possible_array_types(this.data);
      var option = u$.choose_column_type(options);
      if(option.type !== this.type){
        this.setType(option.type,false);
        this.data = option.array;
      }
    }
  };

  Column.prototype.setType = function(type,if_coerce){
    var coerce_from = this.type;
    this.type = u$.ensureType(type);
    this.get = function (row) {
      return this.data[row];
    };
    if( this.type ){
      this.as_json = function(row){
        return this.type.to_json(this.data[row]);
      };
      this.as_string = function(row) {
        return this.type.to_string(this.data[row]);
      };
      this.set = function(row,v){
        this.data[row] = this.type.coerce(v);
      };
      if(if_coerce && !u$.isNullish(coerce_from) ){
        this.coerceData(coerce_from);
      }
    }else{
      this.as_json = this.get ;
      this.as_string = function(row) {
        return u$.ensureString(this.data[row]) ;
      };
      this.set = function(row,v){
        this.data[row] = v;
      };
    }
  };

// ColumnSet - store all columns `byIndex` in array and  `byName` in hashtable.
  var ColumnSet = function () {
    this.byIndex = [];
    this.byName = {};
  };

// get column either by name or by index
  ColumnSet.prototype.getColumn = function (name_or_idx) {
    return (_.isNumber(name_or_idx) ? this.byIndex : this.byName )[name_or_idx];
  };

// enforce column by name
  ColumnSet.prototype.enforceColumn = function (name, n_rows, type) {
    var c = this.byName[name];
    if (u$.isNullish(c)) {
      c = new Column(name, n_rows, type);
      c.col_idx = this.byIndex.length;
      this.byIndex.push(c);
      this.byName[name] = c;
    }
    return c;
  };

// enforce column by `col_idx`, `name` will be set to `'c'+col_idx`
  ColumnSet.prototype.enforceColumnAt = function (col_idx, n_rows, type) {
    var c = this.byIndex[col_idx];
    if (u$.isNullish(c)) {
      var name = "c" + col_idx;
      c = new Column(name, n_rows, type);
      c.col_idx = col_idx;
      this.byIndex[col_idx] = c;
      this.byName[name] = c;
    }
    return c;
  };

// add bunch of columns, preallocate array for `n_rows`
  ColumnSet.prototype.addColumns = function (cols, n_rows) {
    for (var i = 0; i < cols.length; i++) {
      var name = cols[i], type;
      if (_.isPlainObject(cols[i])) {
        name = cols[i].name;
        type = u$.ensureType(cols[i].type);
      }
      this.enforceColumn(name, n_rows, type);
    }
    return this;
  };

  ColumnSet.prototype.getStorageSize=function(){
    function max_data_length(prev, col) {
      return prev > col.data.length ? prev : col.data.length;
    }
    return this.byIndex.reduce(max_data_length, 0);
  };

  ColumnSet.prototype.setStorageSize=function(size){
    var storageSize = this.getStorageSize();
    if( size < storageSize ){
      throw u$.error({ msg:'cannot reduce column storage size',
        current: storageSize, requested: size} );
    }
    return this.byIndex.forEach(function(col){col.data.length = size;});
  };

// ## <section id='DataFrame'>Dataframe</section>
//
// **new Dataframe(rows,columns)**:
//    - `rows` - array of rows. row could be array or object.
//    - `config` :
//      - `columns` - array that contains column names or objects with `{name: "colname",type: "number"}`.
// TODO documentation for config

  var DataFrame = function (rows, config) {
    var obj = this;
    if (_.isUndefined(obj) || obj.constructor !== DataFrame) {
      return new DataFrame(rows, config);
    }
    config = config || {};
    rows = rows || [];
    this.columnSet = new ColumnSet().addColumns(config.columns || [], rows.length);
    this.index = _.range(rows.length);
    for (var row = 0; row < rows.length; row++) {
      var row_data = rows[row];
      if (_.isPlainObject(row_data)) {
        var keys = Object.keys(row_data);
        for (var k = 0; k < keys.length; k++) {
          this.columnSet.enforceColumn(keys[k]).set(row, row_data[keys[k]]);
        }
      } else if (_.isArray(row_data)) {
        for (var col_idx = 0; col_idx < row_data.length; col_idx++) {
          this.columnSet.enforceColumnAt(col_idx).set(row, row_data[col_idx]);
        }
      } else {
        throw {msg: "row should be object or array and not:" + row_data};
      }
    }
    return obj;
  };

  function make_df_from_(array_of_rows, config) {
    config = config || {columns: array_of_rows.shift()};
    return new DataFrame(array_of_rows, config);
  }

  function parse_csv_to_array_of_rows(str,offset) {
    var arr = [];
    var quote = false;  // true means we're inside a quoted field

    var row, col, c;
    for (row = col = 0 , c = offset; c < str.length; c++) {
      var cc = str[c], nc = str[c + 1];        // current character, next character
      arr[row] = arr[row] || [];             // create a new row if necessary
      arr[row][col] = arr[row][col] || '';   // create a new column (start with empty string) if necessary
      if (cc === '"' && quote && nc === '"') { // if two quotes inside quoted field
        arr[row][col] += cc;
        ++c;
        continue; // add quote and skip next char
      }
      if (cc === '"') { // if lone quote
        quote = !quote;
        continue; // toggle quoted field
      }
      if (cc === ',' && !quote) { // if comma in the wild
        ++col;
        continue; // start next cell
      }
      if (cc === '\n' && !quote) { // if new line in the wild
        ++row;
        col = 0;
        continue;  // move to next row
      }
      arr[row][col] += cc; // or add char to current cell
    }
    return arr;
  }

  DataFrame.prototype.to_csv = function() {
    var s = '' , col,row, v, cc;
    for (col = 0; col < this.columnSet.byIndex.length; col++) {
      if (col > 0 ) {
        s+= ',' ;
      }
      s+= this.columnSet.byIndex[col].name;
    }
    s+= '\n';
    for (row = 0; row < this.getRowCount(); row++) {
      for (col = 0; col < this.columnSet.byIndex.length; col++) {
        if (col > 0 ) {
          s+= ',' ;
        }
        v = this.get(row,col,'as_string');
        if( v.indexOf('"') >= 0 ||
            v.indexOf(',') >= 0 ||
            v.indexOf('\n') >= 0 ){
          s+='"';
          for (var i = 0; i < v.length; i++) {
            cc = v[i];
            if(cc==='"') {
              s += cc;
            }
            s+= cc;
          }
          s+='"';
        }else{
          s+= v;
        }
      }
      s+= '\n';
    }
    return s;
  };


// **parse_csv(str,header)**
//
// parse comma separated values (CSV) format  provided in string `str`.
// `header` is array with column names, if omitted first line of  CSV  in `str` considered header .

  DataFrame.parse_csv = function (str, config) {
    return make_df_from_(parse_csv_to_array_of_rows(str,0), config);
  };

  function parse_lf_separated(str,offset){
    var arr = [], row = '', c;
    function append_row(){
        arr.push([row]);
    }
    for (c = offset; c < str.length; c++) {
      var cc = str[c];
      if (cc === '\n') {
        append_row();
        row = '';
      } else {
        row += cc;
      }
    }
    append_row();
    return arr;
  }

  function parse_lf_separated_json(str,offset){
    var arr = [], row = '', c;
    function append_row(){
      if(row.length > 0){
        arr.push(JSON.parse(row));
      }
    }
    for (c = offset; c < str.length; c++) {
      var cc = str[c];
      if (cc === '\n') {
        append_row();
        row = '';
      } else {
        row += cc;
      }
    }
    append_row();
    return arr;
  }
  DataFrame.parse_wdf=function(str) {
    var rows = parse_lf_separated_json(str,0);
    var config = rows.shift();
    return new DataFrame(rows,config);
  };

  DataFrame.prototype.to_wdf=function(){
    var s = '';
    s+=JSON.stringify(this.getConfig());
    s+='\n';
    this.apply(function(row){
      s+=JSON.stringify(this.getJsonRow(row));
      s+='\n';
    });
    return s;
  };

  function parse_dom_table_to_array_of_rows(dom_table) {
    return [].map.call(dom_table.rows, function (dom_row) {
      return [].map.call(dom_row.cells, function (c) {
        return c.textContent;
      });
    });
  }

  DataFrame.prototype.detectColumnTypes=function(list_of_columns){
    list_of_columns = list_of_columns || this.getColumnNames();
    for(var i = 0 ; i < list_of_columns.length ; i++){
      var col = this.columnSet.byName[list_of_columns[i]];
      col.detectData();
    }
  };

// **parse_dom_table(dom_table, header)**
//
// parse comma separated values (CSV) format  provided in string `dom_table`.
// `header` is array with column names, if omitted first row in  table
// considered header .

  DataFrame.parse_dom_table = function (dom_table, config) {
    return make_df_from_(parse_dom_table_to_array_of_rows(dom_table), config);
  };

  DataFrame.prototype.getColumnNames=function(){
    return Object.keys(this.columnSet.byName);
  };

  DataFrame.prototype.getColumnCount=function(){
    return this.columnSet.byIndex.length;
  };


// **getObjectRow(row_num,result)**
//
// get row out of DataFrame as plain object.
//    - `row_num` - row number

  DataFrame.prototype.getObjectRow = function (row_num) {
    var ph_row = this.index[row_num];
    var result =  {};
    this.columnSet.byIndex.forEach(function (c) {
          result[c.name] = c.get(ph_row);
        });
    return result;
  };
// **getObjectRow(row_num,result)**
//
// get row out of DataFrame as array (no type conversion).
//    - `row_num` - row number
//    - `fn` - how to extract value: `get()` or `as_json()`
  DataFrame.prototype.getArrayRow = function (row_num,fn) {
    fn = fn || 'get';
    var ph_row = this.index[row_num];
    var result = [];
    result.length = this.columnSet.byIndex.length ;
    this.columnSet.byIndex.forEach( function (c, col_idx) {
          result[col_idx] = c[fn](ph_row);
        });
    return result;
  };
// **getJsonRow(row_num)**
//
// get data row as array with dates converted to string
// for json
//    - `row_num` - row number

  DataFrame.prototype.getJsonRow = function (row_num) {
    return this.getArrayRow(row_num,'as_json');
  };

// **get(row,col)**
//
// get one value out of DataFrame
//   - `row_num` - row number
//   - `col` - column index or column name
//   - `fn` -
  DataFrame.prototype.get = function (row_num, col,fn) {
    fn = fn || 'get' ;
    var ph_row = this.index[row_num];
    var c = this.columnSet.getColumn(col);
    return c[fn](ph_row);
  };
// **set(row_num,col,v)**
//
// set value in one cell of DataFrame
//   - `row_num` - row number
//   - `col` - column index or column name
//   - `v` -  value to set
  DataFrame.prototype.set = function (row_num, col, v) {
    var ph_row = this.index[row_num];
    var c = this.columnSet.getColumn(col);
    c.set(ph_row,v);
  };

// **getRowCount()**
//
// get row count
  DataFrame.prototype.getRowCount = function () {
    return this.index.length;
  };
//**newRow()**
//
//add new row. Returns new row number.
  DataFrame.prototype.newRow = function (position) {
    position = position || this.index.length;
    var new_storage_row = this.columnSet.getStorageSize();
    this.columnSet.setStorageSize(new_storage_row+1);
    this.index.splice(position,0,new_storage_row);
    return position;
  };

//**deleteRow(row_num)**
//
//delete row by `row_num`.
  DataFrame.prototype.deleteRow = function (row_num) {
    this.index.splice(row_num, 1);
  };
// getColumn(col)
//
// get all data out column. returns array of values
//   - `col` - column index or column name
  DataFrame.prototype.getColumn = function (col) {
    var c = this.columnSet.getColumn(col);
    if (c) {
      return this.index.map(function (idx) {
        return c.get(idx);
      });
    }
    return undefined;
  };

  DataFrame.prototype.getColumnIndex = function (name_or_idx) {
    return this.columnSet.getColumn(name_or_idx).col_idx;
  };
  DataFrame.prototype.getColumnName = function (name_or_idx) {
    return this.columnSet.getColumn(name_or_idx).name;
  };

// ** apply(logic) **
//
// run `logic(df,row_num)` function on all rows of DataFrame
//
//
  DataFrame.prototype.apply = function (logic) {
    for (var row_num = 0; row_num < this.index.length; row_num++) {
      logic.call(this, row_num);
    }
  };
// ** map(logic) **
//
// run `logic(df,row_num)` function on all rows of DataFrame.
// Collect results from each run into array. `undefined` results
// will not be included in array.
//
//
  DataFrame.prototype.map = function (logic) {
    var collector = [], r;
    for (var row_num = 0; row_num < this.index.length; row_num++) {
      r = logic.call(this, row_num);
      if (r !== undefined) {
        collector.push(r);
      }
    }
    return collector;
  };
// **getData()**
//
// Get all data in structure:
// returns {Object}
//   - config :
//     - columns - columns array
//       - name - column name
//       - type - column type, if defined
//   - rows - array of rows. each row array of values.
//

  DataFrame.prototype.getConfig=function () {
    var config = { columns : []};
    for (var col = 0; col < this.columnSet.byIndex.length; col++) {
      var column = this.columnSet.byIndex[col];
      var col_def = {name: column.name};
      if (column.type) {
        col_def.type = column.type.name;
      }
      config.columns.push(col_def);
    }
    return config;
  };

  DataFrame.prototype.getData = function () {
    var r = { config: this.getConfig(), rows: []};
    r.rows = this.map( this.getArrayRow ) ;
    return r;
  };

  DataFrame.prototype.setColumnType = function (col,new_type) {
    this.columnSet.getColumn(col).setType(new_type);
  };

// **getObjects()**
//
// returns all rows in  array , each row is object
// with column names pointing to values
//

  DataFrame.prototype.getObjects = function () {
    return this.map( this.getObjectRow );
  };

  DataFrame.MultiPart = function (fragment_factory,  config ){
    /*
    @param parser {}
      @param header function(buffer,offset) returns newoffset
      @param line function(buffer,offset) return newoffset
    @param fragment_factory function(direction, offset)
    @param columns [] or undefined
     provided if first fragment does not contain header.
     */
    this.file_type = file_type ;
    this.fragment_factory = fragment_factory;
    this.config = config ;
    this.hasHeader = ! u$.isNullish(config);
    this.fragment_store = [];
    this.fragment_factory('F',0).then( this.parse_fragment.bind(this) ) ;
  };

  var mime2parser = {
    'text/plain' : {
      parse: parse_lf_separated,
      static_header: { columns: [ 'line' ] } },
    'text/wdf' : {
      parse: parse_lf_separated_json,
      adjust_header: function(header){return header;} },
    'text/csv' : {
      parse: parse_csv_to_array_of_rows,
      adjust_header: function(header){return {columns: header};} },
  };

  DataFrame.MultiPart.prototype.parse_fragment=function(fragment){
    var meta_data_idx = fragment.indexOf('\n');
    var meta_data = JSON.parse(fragment.substr(0,meta_data_idx));
    /*
     @param filesize
        size of file
     @param mtime
        modification time of file
     @param start_position @param end_position
        fragment boundaries in file. `end_positon` can be smaller
        then `start position` if direction is backward `'B'`
     @param num_of_records
     @param content_type
        mime type of original file
     @param direction 'F' or 'B'
     */
    var parser = mime2parser[meta_data.content_type];

    if( !this.hasHeader && parser.static_header ){
      this.config = parser.static_header;
    }

    if( meta_data.start_position !== 0 && ! this.hasHeader && ! this.config ) {
      this.deferred_fragments = this.deferred_fragments || [];
      this.deferred_fragments.push(fragment);
      return;
    }
    var rows = parser.parse(fragment,meta_data_idx+1);
    if( meta_data.start_position === 0 && meta_data.end_position > 0 ){
      if( ! this.hasHeader ){
        this.config = parser.adjust_header(rows.shift());
      }
    }
    this.fragment_store.push([meta_data, new DataFrame(rows,this.config)]);
    if( this.deferred_fragments ){
      var deferred = this.deferred_fragments;
      this.deferred_fragments = undefined;
      deferred.forEach(this.parse_fragment.bind(this));
    }
  };
  module.exports = DataFrame;


})();