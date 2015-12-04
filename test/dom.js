try{
  var jsdom = require('jsdom').jsdom;
  module.exports = function ( html){
    return jsdom(html).body.firstChild;
  };
}catch(e){
  module.exports = function ( html){
    var elem = document.createElement("div");
    elem.innerHTML = html;
    return elem.firstElementChild;
  };
}
