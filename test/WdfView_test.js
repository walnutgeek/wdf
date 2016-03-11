var assert = require('assert');
var _ = require("lodash");
var u$ = require("../utils");

var WdfView = require("../WdfView");
var DataFrame = require("../DataFrame");

var assert_error = require('./assert_error');


describe( 'WdfView',function() {
  it('all_types', function () {
    var document = require("./dom_fragment")('<div></div>').document;
    var df = DataFrame.parse_wdf( require('./all_types_wdf') );
    new WdfView({document:document,df:df});
  });
  it('all_types_including_link', function () {
    var document = require("./dom_fragment")('<div></div>').document;
    var df = DataFrame.parse_wdf( require('./all_types_including_link'));
    new WdfView({document:document,df:df});
  });
  function setUpDoc(){
    if(!WdfView.hasDefault('document') || !WdfView.getDefault('document')){
      var document = require("./dom_fragment")('<div id="x"></div>').document;
      WdfView.setDefault('document',document);
    }else{
      if( !WdfView.getDefault('document').querySelector('#x') ){
        var doc = WdfView.getDefault('document');
        var div = doc.createElement('div');
        div.id = 'x';
        doc.body.appendChild(div);
      }
    }
  }
  function cleanUpDoc(){
    var doc = WdfView.getDefault('document');
    if( doc ){
      var div = doc.querySelector('#x');
      if( div && div.remove ){
        div.remove();
      }
    }
  }
  it('defaults', function () {
    setUpDoc();
    assert.equal(false, !WdfView.getDefault('document'));

    WdfView.setDefault('document', undefined);
    var df = DataFrame.parse_wdf( require('./all_types_wdf') );

    var e = u$.jail(function () {
      new WdfView({
        df: df,
        container: '#x'
      });
    });
    assert_error(e, 'Error: document parameter has to be defined');
  });
  it('attach to container', function () {
    setUpDoc();

    var df = DataFrame.parse_wdf( require('./all_types_wdf') );
    var get_cell = require("../ViewTheme").get_cell;

    var v = new WdfView({
      df:df,
      format: {cell_by_name: {d: get_cell}},
      container:'#x',
      max_width:50
    });

    v.setColumnWidth('ts',20);
    var e = u$.jail(
        function () {
          new WdfView({
            container: '#x'
          });
        });
    assert_error( e, 'Error: df parameter has to be defined' );
    e = u$.jail(function(){
      new WdfView({
        df:df,
        container:'#y'
      });
    });
    assert_error(e, 'Error: container query does not match anything.',
        '{"query":"#y"}');
    cleanUpDoc();
  });

});