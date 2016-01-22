(function() {
  "use strict";

  var _ = require("lodash");
  var u$ = require("./utils");
  var DataFrame = require("./DataFrame");

  var defaults = {
    format: null,
    widths: {},
    theme: require('./ViewTheme'),
    max_width: 300,
  } ;

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

  function render_value(div,v){
    if( u$.isPrimitive(v) ){
      div.innerText = v ;
    }else{
      div.appendChild(v);
    }
  }
  function WdfView(props){
    props = _.defaults(props,defaults);
    this.props = props;
    if(!this.props.df){
      throw u$.error({msg: 'df parameter has to be defined'});
    }
    this.df = this.props.df ;
    if(!this.props.document){
      throw u$.error({msg: 'document parameter has to be defined'});
    }
    if( this.props.container ){
      if( _.isString(this.props.container) ){
        var queried = this.props.document.querySelector(this.props.container);
        if(!queried){
          throw u$.error({
            msg:'container query does not match anything.',
            query: this.props.container});
        }
        this.props.container = queried;
      }
      this.props.container.innerHTML='';
      this.props.container.wdfView = this ;
    }
    this.id = 'wdf_id_' + getUniqueId();
    this.header =  this.new_elem(this.props.container, 'table', ['wdf','wdf_header', this.id]);
    this.data =    this.new_elem(this.props.container, 'table', ['wdf','wdf_data',this.id]);
    var head_tr =  this.new_elem(this.header, 'tr',['wdf']);

    function get_formatter(name,arg){
      return props.theme[name](props.format,arg);
    }

    var header_cell_fn = get_formatter('header_cell_fn');
    var columnNames = this.df.getColumnNames();
    var cell_fns = [] ;
    var r, tr, th, td, div, col_name;
    for(var col_idx = 0 ; col_idx < columnNames.length; col_idx++ ){
      col_name = columnNames[col_idx];
      cell_fns[col_idx]=get_formatter('cell_fn',this.df.columnSet.byIndex[col_idx]);
      th = this.new_elem(head_tr,'th',['wdf'],
          {'data-column':col_name});
      div = this.new_elem(th,'div',['wdf_masker']);
      r = header_cell_fn.call(th, this, col_idx, col_name);
      if( !_.isUndefined(r) ){
        if( _.isPlainObject(r) ){
          render_value(div,r.value);
          setAllAttributes(div,r.div_attrs);
          setAllAttributes(th,r.th_attrs);
        }else{
          render_value(div,r);
        }
      }
    }

    r = get_formatter('header_row_fn').call(head_tr,this);
    if( _.isPlainObject(r) ) {
      setAllAttributes(head_tr, r);
    }

    var row_fn = get_formatter('row_fn');
    for(var row_idx = 0 ; row_idx < this.df.getRowCount(); row_idx++ ){
      var odd_even = 'wdf_' + (row_idx % 2 ? 'odd' : 'even');
      tr = this.new_elem(this.data,'tr',[ 'wdf',  odd_even ],
          {'data-row':row_idx});
      for( col_idx = 0 ; col_idx < columnNames.length; col_idx++ ){

        col_name = columnNames[col_idx];
        td = this.new_elem(tr,'td',['wdf'],
            {'data-column':col_name});
        div = this.new_elem(td,'div',['wdf_masker']);
        r = cell_fns[col_idx].call(td, this, row_idx, col_idx, col_name);

        if( !_.isUndefined(r) ){
          if( _.isPlainObject(r) ){
            render_value(div,r.value);
            setAllAttributes(div,r.div_attrs);
            setAllAttributes(td,r.td_attrs);
          }else{
            render_value(div,r);
          }
        }
        r = row_fn.call(tr, this, row_idx);
        if( _.isPlainObject(r) ) {
          setAllAttributes(tr, r);
        }
      }
    }
    this.widths = this.getColumnWidthStats();
    this.setAllColumnWidths();
    this.markOverflownColumn();
  }

  WdfView.setDefault=function(key,value){
    defaults[key]=value;
  };

  WdfView.getDefault=function(key){
    return defaults[key];
  };

  WdfView.hasDefault=function(key){
    return defaults.hasOwnProperty(key);
  };

  u$.jail(function(){
    WdfView.setDefault('document', document);
  });

  u$.jail(function(){
    WdfView.setDefault('jQuery', jQuery);
    jQuery.fn.WdfView=function(props){
      if (this && this[0]){
        props = _.defaults(props,{container: this[0]});
        new WdfView(props);
      }
    };
  });

  WdfView.prototype.new_elem = function (parent, tag , classes, attrs){
    var e = this.props.document.createElement(tag);
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
    var elems = this.props.document.querySelectorAll(q);
    for(var i = 0 ; i < elems.length; i++ ){
      var cell = elems[i] ;
      var row = cell.parentElement.getAttribute('wdf_row');
      fn.call(this,row,colName,cell);
    }
  };

  WdfView.prototype.applyToAllCells = function(fn){
    var q = '.'+this.id+' tr' ;
    var elems = this.props.document.querySelectorAll(q);
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
  function markOverflownCell( row, col_name, cell) {
    var real_w = cell.firstChild.scrollWidth;
    var visual_w = cell.firstChild.offsetWidth;
    if (real_w > visual_w) {
      cell.classList.add('wdf_over');
    } else {
      cell.classList.remove('wdf_over');
    }
  }


  WdfView.prototype.setColumnWidth = function(col,width){
    var colName = this.df.getColumnName(col);
    this.widths[colName].current = width ;
    this.applyToColumn(col,function(row,col_name,cell){
      cell.firstChild.style.width = width + 'px';
    });
    this.applyToColumn(col,markOverflownCell);
  };

  WdfView.prototype.setAllColumnWidths = function(){
    this.applyToAllCells(function(row,col_name,cell){
      var col_width = this.widths[col_name];
      if( !col_width.current  ){
        col_width.current = col_width.max > this.props.max_width ?
            this.props.max_width : col_width.max;
      }
      cell.firstChild.style.width = col_width.current + 'px';
    });
  };


  WdfView.prototype.markOverflownColumn = function(){
    this.applyToAllCells(markOverflownCell);
  };

  WdfView.prototype.getColumnWidthStats = function(){
    var real_width_stats = {};
    this.applyToAllCells(function(row,col_name,cell){
      var real_w = cell.firstChild.scrollWidth ;
      u$.collect_stats(col_name,real_w,real_width_stats);
    });
    return real_width_stats;
  };

  module.exports = WdfView;
})();