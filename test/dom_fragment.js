// ```
// var dom_fragment = require("./dom_fragment");
// dom_fragment('<div>hello</div>')
// ```
//
try{
  var jsdom = require('jsdom').jsdom;
  module.exports = function ( html){
    var doc = jsdom(html);
    return {
      document: doc,
      window: doc.defaultView,
      element: doc.body.firstChild };
  };
}catch(e){
  // jsdom is not available in browser so
  // fall back to native DOM
  module.exports = function (html){
    var elem = document.createElement("div");
    elem.innerHTML = html;
    return {
      document: document,
      window: window,
      element: elem.firstElementChild };
    ;
  };
}
