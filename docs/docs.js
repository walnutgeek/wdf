console.log("Hello");
module.exports = function(sources,title,hasTitle,sections){
  console.log(JSON.stringify({sources:sources,title:title,hasTitle:hasTitle, sections:sections}));
}