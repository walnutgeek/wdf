var assert = require('assert');
var _ = require("lodash");
var u$ = require("../wdf/utils");

var WdfView = require("../wdf/WdfView");
var DataFrame = require("../wdf/DataFrame");


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

    assert.equal(' {"msg":"document parameter has to be defined"}',
        u$.jail(function () {
          new WdfView({
            df: df,
            container: '#x'
          });
        }).toString()
    );
  });
  it('attach to container', function () {
    setUpDoc();

    var df = DataFrame.parse_wdf( require('./all_types_wdf') );
    var get_cell = require("../wdf/ViewTheme").get_cell;

    var v = new WdfView({
      df:df,
      format: {cell_by_name: {d: get_cell}},
      container:'#x',
      max_width:50
    });

    v.setColumnWidth('ts',20);

    assert.equal(' {"msg":"df parameter has to be defined"}',
        u$.jail(function(){
          new WdfView({
            container:'#x'
          });
        }).toString()
    );
    assert.equal(' {"msg":"container query does not match anything.","query":"#y"}',
        u$.jail(function(){
          new WdfView({
            df:df,
            container:'#y'
          });
        }).toString()
    );
    cleanUpDoc();
  });

});