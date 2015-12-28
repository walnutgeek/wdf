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
    this.setType = function(type){
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
        if(!u$.isNullish(coerce_from)){
          for(var row = 0 ; row < this.data.length ; row++ ){
            this.data[row] = this.type.coerce(this.data[row],coerce_from);
          }
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
    this.setType(type);
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
  function parse_csv_to_array_of_rows(str) {
    var arr = [];
    var quote = false;  // true means we're inside a quoted field

    var row, col, c;
    for (row = col = c = 0; c < str.length; c++) {
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
    return make_df_from_(parse_csv_to_array_of_rows(str), config);
  };


  DataFrame.parse_wdf=function(str) {
    var arr = str.split('\n');
    var config = JSON.parse(arr.shift());
    var rows = arr.filter(u$.isStringNotEmpty).map(JSON.parse);
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

// **parse_dom_table(dom_table, header)**
//
// parse comma separated values (CSV) format  provided in string `dom_table`.
// `header` is array with column names, if omitted first row in  table
// considered header .

  DataFrame.parse_dom_table = function (dom_table, config) {
    return make_df_from_(parse_dom_table_to_array_of_rows(dom_table), config);
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
//
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
  DataFrame.prototype.newRow = function () {
    var new_row_num = this.index.length;
    this.index[new_row_num] = new_row_num;
    return new_row_num;
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

  module.exports = DataFrame;


})();