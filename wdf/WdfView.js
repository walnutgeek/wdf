(function() {
  "use strict";

  var _ = require("lodash");

  var u$ = require("./utils");
  var DataFrame = require("./DataFrame");
  var default_theme = require('./ViewTheme');

  var getUniqueId =
      ( function () {
        var incrementingId = 0;
        return function() {
          return incrementingId++;
        };
      })();

  function setAllAttributes(elem, attrs){
    if(attrs){
      for(var k in attrs){
        if(attrs.hasOwnProperty(k)){
          elem.setAttribute(k,attrs[k]);
        }
      }
    }
  }


  function WdfView(props){
    this.document = props.document;
    this.df = props.df ;
    this.webPath = props.webPath;
    this.subset = this.df;
    this.format =  props.format || {};
    this.widths =  props.widths || [];
    this.theme =   props.theme || default_theme ;
    this.id = 'wdf_id_' + getUniqueId();
    this.header =  this._new_elem(null, 'table', ['wdf','wdf_header', this.id]);
    this.data =    this._new_elem(null, 'table', ['wdf','wdf_data',this.id]);
    var head_tr =  this._new_elem(this.header, 'tr',['wdf']);
    var header_cell_fn = this.theme.header_cell_fn(this.format) ;
    var columnNames = this.df.getColumnNames();
    var cell_fns = [] ;
    this.width_pairs=[];
    var r, tr, th, td, div, col_name;
    for(var col_idx = 0 ; col_idx < columnNames.length; col_idx++ ){
      col_name = columnNames[col_idx];
      cell_fns[col_idx]=this.theme.cell_fn(this.format,this.df.getColumn(col_idx));
      th = this._new_elem(head_tr,'th',['wdf'],
          {'data-column':col_name});
      this.width_pairs[col_idx]=[th];
      div = this._new_elem(th,'div',['wdf_masker']);
      r = header_cell_fn.call(th, this.df, col_idx, col_name);
      if( !_.isUndefined(r) ){
        if( _.isPlainObject(r) ){
          div.innerText = r.value;
          setAllAttributes(div,r.div_attrs);
          setAllAttributes(th,r.th_attrs);
        }else{
          div.innerText = r ;
        }
      }
    }

    r = this.theme.header_row_fn(this.format).call(head_tr,this.df);
    if( _.isPlainObject(r) ) {
      setAllAttributes(head_tr, r);
    }

    var row_fn = this.theme.row_fn(this.format);
    for(var row_idx = 0 ; row_idx < this.df.getRowCount(); row_idx++ ){
      var odd_even = 'wdf_' + (row_idx % 2 ? 'even' : 'odd');
      tr = this._new_elem(this.data,'tr',[ 'wdf',  odd_even ],
          {'data-row':row_idx});
      for( col_idx = 0 ; col_idx < columnNames.length; col_idx++ ){

        col_name = columnNames[col_idx];
        td = this._new_elem(tr,'td',['wdf'],
            {'data-column':col_name});
        if( row_idx === 0 ){
          this.width_pairs[col_idx][1]=td;
        }
        div = this._new_elem(td,'div',['wdf_masker']);
        r = cell_fns[col_idx].call(td, this.df, row_idx, col_idx, col_name);
        if( !_.isUndefined(r) ){
          if( _.isPlainObject(r) ){
            div.innerText = r.value;
            setAllAttributes(div,r.div_attrs);
            setAllAttributes(td,r.td_attrs);
          }else{
            div.innerText = r ;
          }
        }
        r = row_fn.call(tr, this.df, row_idx);
        if( _.isPlainObject(r) ) {
          setAllAttributes(tr, r);
        }
      }
    }
  }

  WdfView.prototype._new_elem = function (parent, tag , classes, attrs){
    var e = this.document.createElement(tag);
    if(classes){
      classes.forEach(function(c){ e.classList.add(c); });
    }
    setAllAttributes(e,attrs);
    if(parent) parent.appendChild(e);
    return e;
  };

  WdfView.prototype.applyToColumn = function(col,fn){
    var colName = this.df.getColumnName(col);
    var q = '.'+this.id+' [data-column='+ colName +']' ;
    var elems = this.document.querySelectorAll(q);
    for(var i = 0 ; i < elems.length; i++ ){
      var cell = elems[i] ;
      var row = cell.parentElement.getAttribute('wdf_row');
      fn.call(this,row,colName,cell);
    }
  };

  WdfView.prototype.applyToAllCells = function(fn){
    var q = '.'+this.id+' tr' ;
    var elems = this.document.querySelectorAll(q);
    for(var i = 0 ; i < elems.length; i++ ){
      var tr = elems[i];
      var row = tr.getAttribute('wdf_row');
      for(var j = 0 ; j < tr.childNodes.length; j++){
        var cell = tr.childNodes[j];
        var col_name = cell.getAttribute('data-column');
        if(!_.isNull(col_name)){
          fn.call(this,row,col_name,cell);
        }
      }
    }
  };


  WdfView.prototype.getAllColumnWidths = function(from_where){
    from_where = _.isUndefined(from_where) ? 1 : (from_where ? 1 : 0) ;
    return this.width_pairs.map(function(pair){
      return pair[from_where].offsetWidth;
    });
  };

  WdfView.prototype.setColumnWidth = function(col,width){
    this.applyToColumn(col,function(row,col_name,cell){
      cell.firstChild.style.width = width + 'px';
    });
  };

  WdfView.prototype.setAllColumnWidths = function(widths){
    widths = widths || this.getAllColumnWidths();
    this.applyToAllCells(function(row,col_name,cell){
      var col_idx = this.df.columnSet.byName[col_name].col_idx;
      cell.firstChild.style.width = widths[col_idx] + 'px';
    });
  };


  WdfView.prototype.markOverflownColumn = function(){
    var real_width_stats = {};
    this.applyToAllCells(function(row,col_name,cell){
      var real_w = cell.firstChild.scrollWidth ;
      var visual_w = cell.firstChild.offsetWidth ;
      u$.collect_stats(col_name,real_w,real_width_stats);
      if( real_w > visual_w ){
        cell.classList.add('wdf_over');
      }else{
        cell.classList.remove('wdf_over');
      }
    });
    return real_width_stats;
  };

  module.exports = WdfView;
})();