// ## Private stuff
//
// methods and classes that not supposed to be used directly
(function() {
  "use strict";

  // cell_formatter:
  //
  // when called `this` is `<td>` element
  //
  // signature `function(view, row_idx, col_idx, col_name)`
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
  // signature `function(view, col_idx, col_name)`
  // returns:
  // `{ value: <cell value>,
  //    div_attrs: { <name> : <value> ,...}
  //    th_attrs: { <name> : <value> ,...}
  // }`

  // row_formatter:
  //
  // when called `this` is `<tr>` element
  //
  // signature `function(view, row_idx)`
  // returns tr attributes:
  // `{ <name> : <value> ,...}`

  // header_row_formatter:
  //
  // when called `this` is `<tr>` element
  //
  // signature `function(view)`
  // returns tr attributes:
  // `{ <name> : <value> ,...}`


  function get_cell_as_string(view,row_idx,col_idx,col_name) {
    return view.df.get(row_idx,col_idx, 'as_string');
  }

  function get_cell(view,row_idx,col_idx,col_name) {
    return view.df.get(row_idx,col_idx);
  }
  // formatters library
  var FORMATTERS = {
    cell_by_type: {
      date: get_cell_as_string,
      datetime: get_cell_as_string,
      timestamp: get_cell_as_string,
      link: function get_cell(view,row_idx,col_idx,col_name) {
        var link = view.df.get(row_idx,col_idx);
        if(link){
          var a = view._new_elem(null,'a',['wdf_link'],{ href: link.href });
          a.innerText = link.text || link.href;
          return a;
        }
        return undefined;
      }
    },
    other_cell: get_cell,
    header_cell: function(view,col_idx,col_name){
      return col_name;
    },
    row: function(view,row_idx){},
    header_row: function(view){}
  };

  exports.FORMATTERS =FORMATTERS;

  exports.header_cell_fn=function(format){
    return format.header_cell || FORMATTERS.header_cell;
  };

  function find_format_fn(format,col){
    var fn;
    if(col && format){
      if(format.cell_by_name){
        fn =  format.cell_by_name[col.name] ;
      }
      if(!fn && format.cell_by_type && col.type){
        fn = format.cell_by_type[col.type.name];
      }
    }
    if( !fn && format.other_cell ) {
      fn = format.other_cell;
    }
    return fn;
  }
  exports.cell_fn=function(format, col){
    return find_format_fn(format,col) || find_format_fn(FORMATTERS,col);
  };

  exports.row_fn=function(format){
    return format.row || FORMATTERS.row;
  };

  exports.header_row_fn = function (format){
    return format.header_row || FORMATTERS.header_row;
  };


})();