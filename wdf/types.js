//  misc utilities. Initialize it like:
//  ```
//    var u$ = require("./utils");
//  ```
var u$ = require("./utils");
var _ = require("lodash");
// ## private stuff

// order functions take two arguments (let's say `a` and `b`)
// and compare them.
//
// Returns:
//   * `-1` if `a` less then `b`
//   * `1` if `a` greater then `b`
//   * `null` if `a` equals `b`  but you want next
//     order function in chain have it's say
//   * `0` if `a` equals `b` period.
//
// here is generic order function
function generic_order(a,b){
  return a === b ? null : a < b ? -1 : 1 ;
}

function Type(name, props) {
  this.name = name ;
  this.is = props.is ;
  this.from_string = props.from_string ;
  this.notnull_to_string = props.notnull_to_string || u$.ensureString ;
  this.to_string = props.to_string || function (v){
        return u$.isNullish(v) ? "" : this.notnull_to_string(v) ;
      };
  this.order = props.order || generic_order;
  this.compare = t$.orderNullsFirst(this.order);
  t$.types = t$.types || [];
  t$.types.push(this);
  t$[name] = this;
}
// ## PUBLIC FUNCTIONS
var t$ = Type;
module.exports = t$ ;


// ** orderChain(array) **
//
// Create chain of order functions.
t$.orderChain = function(){
  var funcs = u$.extractArray(arguments);
  return function(a,b){
    var rc = 0;
    for (var i = 0; i < funcs.length; i++) {
      var res = funcs[i](a,b);
      if( res !== null ){
        rc = res;
        break;
      }
    }
    return rc;
  };
};
// **orderPredicateFirst(is)**
//
// Turn predicate function(returning `true` or `false`) into
// order function. Order function place `true` first.
t$.orderPredicateFirst = function (is) {
  return function(a, b) {
    return is(a) ? (is(b) ? 0 : -1) : (is(b) ? 1 : null);
  };
};

// Assume we have `indexArray` and `valueArray`. We also have `valueOrder(a,b)`
// function that capable of comparing elements of `valueArray`. `indexArray`
// contains integers pointing to `valueArray`. That set up allow messing with
// order or composition of `indexArray` leave order of `valueArray` unchanged.

// **indexOrder (valueOrder, valueArray)**
//
// creates index order function for given `valueOrder(a,b)`

t$.indexOrder = function (valueOrder, valueArray) {
  return function(a, b) {
    return valueOrder(valueArray[a],valueArray[b]);
  };
};

// ** extractValuesByIndex (indexArray, valueArray)**
//
// extract values out of `valueArray` usinf `indexArray`
t$.extractValuesByIndex = function (indexArray, valueArray) {
  return indexArray.map(function(idx){return valueArray[idx];});
};

// ** createIndex(valueArray) **
//
// returns index array matching `valueArray`
t$.createIndex = function (valueArray) {
  return _.range(valueArray.length);
};
// **orderInverse(f)**
//
// inverse order mandated by `f(a,b)`
t$.orderInverse = function(f) {
  return function(a, b) {
    return f(b, a);
  };
};
//** orderNullsFirst(orderFuncArray) **
//
// Create order function that sort `undefined` - first, `null` - second
// and then according to order functions provided in argument.
t$.orderNullsFirst = function(){
  var funcs = u$.extractArray(arguments);
  funcs.splice(0,0,t$.orderPredicateFirst(_.isUndefined));
  funcs.splice(1,0,t$.orderPredicateFirst(_.isNull));
  return t$.orderChain(funcs);
};
// ** addTypes(typesMap) **
//
//    add types
t$.addTypes=function(typesMap){
  for(var typeName in typesMap){
    if( typesMap.hasOwnProperty(typeName) ){
      new Type(typeName,typesMap[typeName]);
    }
  }
};

var NANs = ["","NaN","null"];

var BOOLEAN_STRINGS = (function(a){
  return a.concat(a.map(function(s){return s[0];}));
})(["no","yes","false","true","0","1"]);

t$.addTypes({
// ** string ** type
  string: {
    is: _.isString,
    from_string: function(v){
      return "" === v ? null : v ;
    }
  },
// ** number ** type
  number: {
    is: _.isNumber,
    from_string: function(v){
      return NANs.indexOf(v) > -1 ? NaN :  u$.numDefault(+v,undefined);
    },
    notnull_to_string: function(v){
      return isNaN(v)? '' : v;
    },
  },
// ** boolean ** type
  boolean: {
    is: _.isBoolean,
    from_string: function(v){
      var idx = BOOLEAN_STRINGS.indexOf(v.toLowerCase());
      return idx < 0 ? undefined : idx % 2 === 1 ;
    },
    order: function(a, b) {
      return a ? (b ? null : 1) : (b ? -1 : null);
    }
  },
// ** datetime ** type
  datetime: {
    is: _.isDate,
    from_string: u$.date_from_string,
    notnull_to_string: u$.date_to_string_fn("YYYY_MM_DD_hh_mm_ss"),
    order: function(a, b) {
      return generic_order( a.valueOf(), b.valueOf());
    }
  },
// ** date ** type
  date: {
    is: _.isDate,
    from_string: u$.date_from_string,
    notnull_to_string: u$.date_to_string_fn("YYYY_MM_DD"),
    order: function(a, b) {
      return generic_order( a.valueOf(), b.valueOf());
    }
  }
});
