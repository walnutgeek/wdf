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
    this.type = type;
  };

  Column.prototype.set = function (row, v) {
    if(this.type && !this.type.is(v)){
      v = this.type.coerce(v);
    }
    //TODO add logic to detect `type` or coerce `v`
    this.data[row] = v;
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

// **parse_csv(str,header)**
//
// parse comma separated values (CSV) format  provided in string `str`.
// `header` is array with column names, if omitted first line of  CSV  in `str` considered header .

  DataFrame.parse_csv = function (str, config) {
    return make_df_from_(parse_csv_to_array_of_rows(str), config);
  };

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

  DataFrame.parse_wdf=function(str) {
    var arr = str.split('\n');
    var config = JSON.parse(arr.shift());
    return new DataFrame(arr.filter(u$.isStringNotEmpty).map(JSON.parse),config);
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

// **getRow(row_num,result)**
//
// get data row out of DataFrame.
//    - `row_num` - row number
//    - `result` - object or array to be filled in. **@optional**
//       if not provided empty object is assumed.

  DataFrame.prototype.getRow = function (row_num, result) {
    var ph_row = this.index[row_num];
    result = result || {};
    this.columnSet.byIndex.forEach(_.isArray(result) ?
        function (c, col_idx) {
          result[col_idx] = c.data[ph_row];
        } :
        function (c) {
          result[c.name] = c.data[ph_row];
        });
    return result;
  };
// **get(row,col)**
//
// get one value out of DataFrame
//   - `row_num` - row number
//   - `col` - column index or column name
//
  DataFrame.prototype.get = function (row_num, col) {
    var ph_row = this.index[row_num];
    var c = this.columnSet.getColumn(col);
    return c.data[ph_row];
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
    c.data[ph_row] = v;
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
        return c.data[idx];
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
      logic(this, row_num);
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
      r = logic(this, row_num);
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
//   - columns - columns array
//     - name - column name
//     - type - column type, if defined
//   - rows - array of rows. each row array of values.
//

  DataFrame.prototype.getData = function () {
    var r = {columns: [], rows: []};
    var columns = this.columnSet.byIndex;
    for (var col = 0; col < columns.length; col++) {
      var column = columns[col];
      var col_def = {name: column.name};
      if (column.type) {
        col_def.type = column.type.name;
      }
      r.columns.push(col_def);
    }
    r.rows = this.map(function (df, row_num) {
      return df.getRow(row_num, []);
    });
    return r;
  };

// **getObjects()**
//
// returns all rows in  array , each row is object
// with column names pointing to values
//

  DataFrame.prototype.getObjects = function () {
    return this.map(function (df, row_num) {
      return df.getRow(row_num);
    });
  };

  module.exports = DataFrame;


})();