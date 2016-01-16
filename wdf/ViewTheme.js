// ## Private stuff
//
// methods and classes that not supposed to be used directly
(function() {
  "use strict";

  // cell_formatter:
  //
  // when called `this` is `<td>` element
  //
  // signature `function(df, row_idx, col_idx, col_name)`
  // returns:
  // `{ value: <cell value>,
  //    div_attrs: { <name> : <value> ,...}
  //    td_attrs: { <name> : <value> ,...}
  // }`
  // , or just `<cell value>` if no attributes on tags
  // need to be set, or `undefined` to indicate that columns
  // not need to be set.

  // header_cell_formatter:
  //
  // when called `this` is `<th>` element
  //
  // signature `function(df, col_idx, col_name)`
  // returns:
  // `{ value: <cell value>,
  //    div_attrs: { <name> : <value> ,...}
  //    th_attrs: { <name> : <value> ,...}
  // }`

  // row_formatter:
  //
  // when called `this` is `<tr>` element
  //
  // signature `function(df, row_idx)`
  // returns tr attributes:
  // `{ <name> : <value> ,...}`

  // header_row_formatter:
  //
  // when called `this` is `<tr>` element
  //
  // signature `function(df)`
  // returns tr attributes:
  // `{ <name> : <value> ,...}`


  // formatters library
  var FORMATTERS = {
    cell: {
      types : {
        any: function(df,row_idx,col_idx,col_name) {
          return df.get(row_idx,col_idx);
        }
      },
    },
    header_cell: function(df,col_idx,col_name){
      return col_name;
    },
    row: function(df,row_idx){},
    header_row: function(df){}
  };

  exports.FORMATTERS =FORMATTERS;

  exports.header_cell_fn=function(format){
    return format.header_cell || FORMATTERS.header_cell;
  };

  exports.cell_fn=function(format, col){
    var fn;
    if(col){
      if(format && format.cell){
        fn = format.cell[col.name] ;
        if(!fn){
          if(col.type){
            fn = format.cell[col.type];
          }
        }
      }
      if(!fn){
        if(col.type){
          fn = format.cell[col.type];
        }
      }
      if(fn)
        return fn;
    }
    return FORMATTERS.cell.types.any;
  };

  exports.row_fn=function(format){
    return format.row || FORMATTERS.row;
  };

  exports.header_row_fn = function (format){
    return format.header_row || FORMATTERS.header_row;
  };


})();