(function(){
  // decorate calcualtion by caching value

  module.exports = function(attr, calc_fn){
    return function(){
      if( !this.hasOwnProperty(attr) ){
        this[attr] = calc_fn.apply(this,arguments);
      }
      return this[attr];
    };
  };
})();
