require("../wdf/wdf_view.css");
var WdfView = require("../wdf/WdfView");

if( WdfView.hasDefault('document') ){
  document.addEventListener('DOMContentLoaded', function(){
    var DataFrame = require("../wdf/DataFrame");
    var df = DataFrame.parse_wdf( require('./all_types_including_link') );

    var view = new WdfView({df: df, container:'#table'});


//    console.log(view.getAllColumnWidths());
//    var interval = setInterval(function(){
////        console.log(wdf.getAllColumnWidths());
//    },100);
//    setTimeout(function(){
//      clearInterval(interval);
//    },500);

  }, false);
}
