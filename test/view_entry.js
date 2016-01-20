require("../wdf/wdf_view.css");
var WdfView = require("../wdf/WdfView");

if( WdfView.hasDefault('document') ){
  document.addEventListener('DOMContentLoaded', function(){
    var DataFrame = require("../wdf/DataFrame");
    var df = DataFrame.parse_wdf( require('./all_types_wdf') );

    var view = new WdfView({df: df, container:'#table'});

    view.setAllColumnWidths(view.getAllColumnWidths().map(
        function(n){return n > 100 ? 100 : n;}
    ));
//    console.log(view.getAllColumnWidths());
//    var interval = setInterval(function(){
////        console.log(wdf.getAllColumnWidths());
//    },100);
//    setTimeout(function(){
//      clearInterval(interval);
//    },500);

  }, false);
}
