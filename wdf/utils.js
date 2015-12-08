//  misc utilities. Initialize it like:
//  ```
//    var u$ = requre("wdf/utils");
//  ```
"use strict";
var u$ = module.exports = {} ;
var _ = require("lodash");

//
// ## Detect Types


// **isUint32(o)**
//
// `true` if `o` is whole number
u$.isUint32=function(a) {
  return _.isNumber(a) && a >= 0 && a <= 0xFFFFFFFF && a % 1 === 0 ;
};

// ** testFor(a,condition,predicates) **
//
//  * `a` - to test
//  * `condition` - `'some'` or `'every'`
//  *
u$.testFor = function (a,condition,predicates){
  u$.assert(condition,['some','every']);
  return Array.prototype[condition].call(predicates,
      function(f){return f(a)});
};

// **isNullish(o)**
//
// `true` if `o` is boolean
u$.isNullish=function(a) {
  return _.isNull(a) || _.isUndefined(a);
};


// **isPrimitive(a)**
//
// returns `true` if `a` is build-in non composite type
u$.isPrimitive=function(a) {
  return _.isString(a) || _.isNumber(a) || _.isBoolean(a) ||
      _.isFunction(a) || _.isDate(a);
};


// **isArrayEmpty(array)**
//
// returns `true` if `array` is nullish or empty
u$.isArrayEmpty=function(array){
  return u$.isNullish(array) || (_.isArray(array) && array.length === 0);
};


// **isStringEmpty(s)**
//
// returns `true` if `s` is nullish or empty string
u$.isStringEmpty=function(s){
  return u$.isNullish(s) || ( _.isString(s) && s.trim().length === 0);
};


// **numDefault(v,default_v)**
//
// returns `default_v` if `v` is Nullish or NaN, otherwise returns `v`
u$.numDefault=function(v,default_v){
  if(u$.isNullish(v) || isNaN(v)){
    return default_v;
  }
  return v;
};


// ## Function Utils

//**brodcastCall(brodcastTo, funcName, args, vocal)**
//
// call method with `funcName` on each object from `brodcastTo`
// array. `args` passed for each of these calls. `vocal` - optional
// controls error throwing behavior, default or false be silent -
// do not throw exceptions.
u$.brodcastCall=function(brodcastTo, funcName, args, vocal){
  vocal = vocal || false;
  if(! u$.isArrayEmpty(brodcastTo) ){
    brodcastTo.forEach(
        function(castTo){
          var f = castTo[funcName];
          if( _.isFunction(f) ){
            f.apply(castTo,args);
          }else if( vocal ){
            throw u$.error({message: "No such function", funcName: funcName, obj: castTo });
          }
        }
    );
  }
};


//** new_Object(constructor, args) **
//
// Call `constructor` passing variable number of `args` as  array

u$.new_Object = function(constructor, args) {
  var a = [null];
  Array.prototype.push.apply(a,args);
  return new (Function.prototype.bind.apply(constructor, a));
};


// ** extractFunctionName(f) **
//
// extract function name. Does not work for lambas:
//
//  ```
//  > function abc(){}
//  > u$.extractFunctionName(abc);
//   "abc"
//  > var xyz = function(){}
//  > u$.extractFunctionName(xyz)
//   ""
//  >
//  ```
u$.extractFunctionName=function(f) { // because IE does not support Function.prototype.name property
  var m = f.toString().match(/^\s*function\s*([^\s(]+)/);
  return m ? m[1] : "";
};


// ** getPropertyExtractor(property)**
//
// create extractor function that extract property out of object by name:
//
//  ```
//  > var len = u$.getPropertyExtractor("length") ;
//  > len([0,2,4])
//   3
//  >
//  ```
u$.getPropertyExtractor=function(property) {
  return function(o) {
    return o[property];
  };
};


// ** combineKeyExtractors(...extractors)**
//
// create function that call extractror functions one by one
// and first `value !== undefined` get returned:
//
//  ```
//  > var len = u$.combineKeyExtractors(['len','size']
//                     .map(u$.getPropertyExtractor)) ;
//  > len({size: 3})
//   3
//  > len({len: 5})
//   4
//  > len({a: 5})
//   undefined
//  >
//  ```
u$.combineKeyExtractors=function() {
  var extractors = u$.extractArray(arguments);
  return function(o) {
    for ( var i = 0; i < extractors.length; i++) {
      var key = extractors[i](o);
      if(key !== undefined){
        return key;
      }
    }
    return undefined;
  };
};


//## Collections utils

// ** extractArray(args) **
//
// Take arguments object and convert it to array.
// Useful if you want to consume all arguments of
// function as elements of one array, yet you want to allow
// possibility to pass all of them in one argument as
// array as well.
//
// ```
//  > function x(){
//  ...     var args = u$.extractArray(arguments);
//  ...     console.log(args);
//  ...  }
//  > x("a","b");
//   ["a", "b"]
//  > var arr=["z","y"];
//  > x(arr);
//   ["z", "y"]
// ```
u$.extractArray=function(args) {
  if ( !args || args.length === 0) {
    return [];
  } else if (args.length === 1) {
    var arg = args[0];
    if (_.isArray(arg)) {
      return arg;
    }
  }
  return Array.prototype.slice.call(args);
};


// **binarySearch(searchFor, array, comparator, mapper)  **
//
// search sorted `array` and return index of element that match
// `searchFor`. If index positive it points on exact matched
// element. If negative - no match found, and value of `1 - negative_index`
// will point to where such element should be located in `array`.  `mapper(array_elem)`
// allow for optional level of indirection, and map value from `array`
// to object that will be compared with `searchFor`. `comparator(a,b)` is logic
// that compare objects. It is a order function that roughly does
// something like: `a < b ? -1 : a > b ? 1 : 0`
//
// ```
//  > var array = [ 1, 2, 4, 6, 8, 10, 25 ];
//  > u$.binarySearch(4, array, t$.number.compare);
//   2
//  > u$.binarySearch(7, array, t$.number.compare);
//   -5
// ```
u$.binarySearch=function(searchFor, array, comparator, mapper) {
  var mapToValue = mapper || function(x) {
        return x;
      };
  var min = 0;
  var max = array.length - 1;
  var mid, r;
  while (min <= max) {
    mid = ((min + max) / 2) | 0;
    r = comparator(searchFor, mapToValue(array[mid]));
    if (r > 0) {
      min = mid + 1;
    } else if (r < 0) {
      max = mid - 1;
    } else {
      return mid;
    }
  }
  return -1 - min;
};


//**repeat(n,value)**
//
// repeats `value` in array `n` times.  If `value` is function
// result of `value(i)` call will be stored in array instead.

u$.repeat=function(n, value) {
  var result = [];
  for ( var i = 0; i < n; i++) {
    result.push(_.isFunction(value) ? value(i) : value);
  }
  return result;
};

//**convertListToObject(array,extractor) **
//
// converts array to object.  `extractor(v)` retrieve key  from each
// element of array. If key is defined key-value pair will be stored
// in object.
u$.convertListToObject=function(array,extractor) {
  var obj = {};
  for ( var i = 0; i < array.length; i++) {
    var v = array[i];
    var k = extractor(v);
    if( k !== undefined ){
      obj[k] = v;
    }
  }
  return obj;
};


//** convertFunctionsToObject(funcList)**
//
// Extract name of functions and use them as keys to reshape `funcList` array
// to object.
u$.convertFunctionsToObject=function(funcList) {
  return u$.convertListToObject(funcList,
      u$.combineKeyExtractors(
          u$.getPropertyExtractor("name"),
          u$.extractFunctionName));
};


//** applyOnAll(obj, action) **
//
// apply `action(v,k,obj)` on all elements of `obj`
// object
u$.applyOnAll=function(obj, action) {
  for ( var k in obj) {
    if (obj.hasOwnProperty(k)) {
      action(obj[k], k, obj);
    }
  }
};



//** join(collection, delimiter, toValue)**
//
// join elements of `collection`
//   * `collection` - array or object.
//   * `delimiter` - delimiter value or function. if omitted `','`
//     is assumed. When value provided same delimiter will be inserted
//     in between elements of collection. With function
//     `delimiter(collection, fromBegining, fromEnd)` you can control
//     delimiters for each position separately including before first
//     and after last element. Before and after delimiters set to empty
//     string by default.
//   * `toValue` - optional, by default identity function. transform
//     elements before join.
u$.join=function(collection, delimiter, toValue) {
  var keys = _.isArray(collection)  || _.isTypedArray(collection)  ?
      collection : Object.keys(collection) ;
  if (!toValue) {
    toValue = function (s) {
      return s;
    };
  }
  if (u$.isNullish(delimiter) ) {
    delimiter = ',';
  }
  var doDelimit = delimiter;
  if (!_.isFunction(delimiter)) {
    doDelimit = function (collection, fromBegining, fromEnd) {
      return (fromBegining < 0 || fromEnd < 0) ? '' : delimiter;
    };
  }
  var indexFromBegining = -1; // -1 means delimiter before of first element
  var indexFromEnd = keys.length-1; //it become -1 for delimiter after of last element
  var result = '';
  while (indexFromBegining < keys.length) {
    if (indexFromBegining >= 0) {
      result += toValue(keys[indexFromBegining], collection);
    }
    result += doDelimit(keys, indexFromBegining, indexFromEnd, collection);
    indexFromBegining++;
    indexFromEnd--;
  }
  return result;
};


// ## Misc

//** filterChars(s,filter) **
//
// starting from beginning filter all characters
// that meet `filter(char(string),index(int),whole_string(string))->boolean`
// function requirements.
//
// Returns position where criteria no longer met.
u$.filterChars=function(s,filter){
  var at = 0 ;
  while( at < s.length && filter(s.charAt(at),at,s) ) {
    at++;
  }
  return at;
};


//** detectRepeatingChar(s,prefix_ch) **
//
// detect repeating char `prefix_ch` in beginning of the line `s`
u$.detectRepeatingChar=function(s,prefix_ch){
  return u$.filterChars(s,function (ch){
    return ch === prefix_ch;
  });
};

//** detectPrefix ( s, prefix ) **
//
// checks if `s` starts with `prefix`. Essentially this is the
// same as `String.prototype.startWith(prefix)` but ES6 not quite here yet.
u$.detectPrefix=function(s,prefix){
  return prefix.length === u$.filterChars(s,function (ch,at){
        return ch === prefix.charAt(at);
      });
};


//** ensureString ( a ) **
//
// ensure String object

u$.ensureString=function(a) {
  return _.isString(a) ? a : String(a);
};


//**error(params,err)**
//
//creates error object or add params to it as it will fly by.
u$.error=function(params,  err) {
  err = err || new Error();
  params = params || {};
  if ( u$.isNullish(err._message) ) {
    err._message  = err.message ? err.message :  params.message || '' ;
    delete params.message;
  }
  if ( _.isPlainObject(err.params) ) {
    _.assign(err.params, params);
  }else{
    err.params = params;
  }
  err.toString = function (){
    var m =  err._message ;
    return _.size(this.params)  ? m + " " + JSON.stringify(this.params) : m;
  };
  return err;
};
//** assert(provided, expected, message) **
//
// throws error if `provided` and `expected` are not equal.
u$.assert=function(provided, expected, message) {
  function check(expected) {
    return provided === expected;
  }
  var equals = _.isArray(expected) ? expected.some(check) : check(expected) ;
  if ( !equals ) {
    throw u$.error({
      message : message || "Unexpected value",
      expected : expected,
      provided : provided,
    });
  }
};

//## Parsing dates

//### some private date related stuff

// pad_with(input,template)
//
// pad `input` value according to `template`

// ```
//  > pad_with(5,'00')
//   '05'
//  > pad_with(5,'0000')
//   '0005'
// ```
function pad_with(input, template) {
  var r = String(input);
  if (r.length !== template.length) {
    r = (template + r).substr(r.length, template.length);
  }
  return r;
}

// pad_with_zeros(input,n)
//
// pad `input` with zeros until it reach `n` size
//
// ```
//  > pad_with_zeros(5,2)
//   '05'
//  > pad_with_zeros(5,4)
//   '0005'
// ```
function pad_with_zeros(input, n) {
  var r = String(input);
  while(r.length < n) {
    r = '0' + r;
  }
  return r;
}

// define supported date patterns
var DATE_PATTERNS = {
  YYYY_MM_DDThh_mm_ss: { delims: ['-','-','T',':',':'] },
  YYYY_MM_DD_hh_mm_ss: { delims: ['-','-',' ',':',':'] },
  YYYYMMDD_hhmmss: { delims: ['','','-','',''] },
  YYYYMMDDhhmmss: { delims: ['','','','',''] },
  YYYY_MM_DD: { delims: ['-','-'] },
  YYYYMMDD: { delims: ['',''] },
};

//prepare text for regexp
var DATE_FIELD_SIZES = [4,2,2,2,2,2];
var pattern_texts = DATE_FIELD_SIZES.map(function(n){
  var s='(';
  while(n--){
    s+='\\d';
  }
  return s+')';
});

// generate regexps in `DATE_PATTERNS`
for(var name in DATE_PATTERNS){
  var o = DATE_PATTERNS[name];
  var n = o.delims.length+1;
  var s = '';
  for (var i = 0; i < n; i++) {
    if(i>0){
      s += o.delims[i-1];
    }
    s += pattern_texts[i];
  }
  o.regexp=new RegExp(s);
}

// build date out of components
function new_date(in_utc,components){
  if (in_utc){
    return new Date(Date.UTC.apply(null,components));
  }else{
    return u$.new_Object(Date, components);
  }
}

// try all patters to parse string
function parse_date(in_utc, s){
  for(var pkey in DATE_PATTERNS){
    var m = DATE_PATTERNS[pkey].regexp.exec(s);
    if(m){
      return new_date(in_utc, (m.length === 4) ? [+m[1],m[2]-1,+m[3]] :
          [+m[1],m[2]-1,+m[3],+m[4],+m[5],+m[6]] );
    }
  }
  return undefined;
}

//### Public Date stuff


//** date_from_string(s)**
//
//  parse string into date assumning UTC timezone
u$.date_from_string=function(s){
  var dt = parse_date(true, s);
  return  dt && 0 === dt.getTime() % (24 * 60 * 60 * 1000 ) ? dt : undefined ;
};

//** datetime_from_string(s)**
//
//  parse string into date assumning UTC timezone
u$.datetime_from_string=function(s){
  return parse_date(true,s);
};


//**date_components(d)**
//
// split Date object into array of components :
// [year, month(1-12), day, hours, minutes, seconds]
// in local time
u$.date_components=function(d){
  return [d.getFullYear(),d.getMonth() + 1,d.getDate(),
    d.getHours(),d.getMinutes(),d.getSeconds()];
};


//**utc_components(d)**
//
// split Date object into array of components :
// [year, month(1-12), day, hours, minutes, seconds]
// in UTC time
u$.utc_components=function(d){
  return [d.getUTCFullYear(),d.getUTCMonth() + 1,d.getUTCDate(),
    d.getUTCHours(),d.getUTCMinutes(),d.getUTCSeconds()];
};

//**SUPPORTED_DATE_FORMATS**
// array of supprted  date formats names

// ```
// > SUPPORTED_DATE_FORMATS
// ["YYYY_MM_DDThh_mm_ss", "YYYY_MM_DD_hh_mm_ss", "YYYYMMDD_hhmmss",
//  "YYYYMMDDhhmmss", "YYYY_MM_DD", "YYYYMMDD"]
// ```
u$.SUPPORTED_DATE_FORMATS = Object.keys(DATE_PATTERNS);


//**date_to_string_fn(format,components_fn)**
//
// create function that will convert Date object into string.
//   * `format` - format name. See SUPPORTED_DATE_FORMATS above.
//   * `components_fn` - (optional) one of 2 functions that to split date
//     into components `utc_components` (default) and `date_components` .

u$.date_to_string_fn=function(format,components_fn){
  components_fn = components_fn || u$.utc_components;
  var delims = DATE_PATTERNS[format].delims ;
  return function(d){
    var d_values = components_fn(d);
    var n = delims.length+1;
    var s = '';
    for (var i = 0; i < n; i++) {
      if(i > 0){
        s += delims[i-1];
      }
      s += pad_with_zeros(d_values[i],DATE_FIELD_SIZES[i]);
    }
    return s;
  };
};
//**dateToIsoString(date)**
//
// date to ISO-2601 string. deprecated in favor
// of `Date.prototype.toISOString`. will be removed soon.
//
//
u$.dateToIsoString=function(date) {
  return date.toISOString();
  /*return date.getUTCFullYear() +  '-' +
   pad_with(date.getUTCMonth() + 1, '00') + '-' +
   pad_with(date.getUTCDate(), '00') + 'T' +
   pad_with(date.getUTCHours(), '00') + ':' +
   pad_with(date.getUTCMinutes(), '00') + ':' +
   pad_with(date.getUTCSeconds(), '00') + '.' +
   pad_with(date.getUTCMilliseconds(), '000') + 'Z';*/
};
//** parseDateUTC(s) **
//
// parse date using on of `SUPPORTED_DATE_FORMATS`
// assuming UTC timezone

u$.parseDateUTC=function(s){
  return parse_date(true,s);
};

//** parseDate(s) **
//
// parse date using on of `SUPPORTED_DATE_FORMATS`
// assuming local timezone

u$.parseDate=function(s){
  return parse_date(false,s);
};
//** relativeDateString(date,rel) **
//
// produce string representation of UTC time in format
//   * `+-hh:mm` if diffirence between `date` and `rel`
//     less then 24 hours
//   * `YYYY-MM-DD hh:mm` otherwise
// ```
// > relativeDateString(new Date(d.getTime()+120000),d)
//  "+00:02"
// > relativeDateString(new Date(d.getTime()-120000),d)
//  "-00:02"
// > relativeDateString(new Date(d.getTime()-1200000000),d)
//  "2015-10-22 08:34"
// ```
u$.relativeDateString=function(date,rel) {
  if(!_.isDate(date)){
    if(!u$.isNullish(date)){
      date = u$.parseDateUTC(date);
    }else{
      return "";
    }
  }
  if(!_.isDate(rel)){
    rel = new Date();
  }
  if( Math.abs(date.getTime() - rel.getTime()) < 86400000 ){
    var a = Math.floor( (date.getTime() - rel.getTime())  / 1000);
    var s = Math.abs(a) + 30;
    var m = Math.floor( s / 60 );
    var h = Math.floor( m / 60 );
    s = s % 60;
    m = m % 60;
    return (a < 0 ? '-' : '+') + pad_with(h, '00') + ':' + pad_with(m, '00')  ;
  }
  return date.getUTCFullYear() + '-' +
      pad_with(date.getUTCMonth() + 1, '00') + '-' +
      pad_with(date.getUTCDate(), '00') + ' ' +
      pad_with(date.getUTCHours(), '00') + ':' +
      pad_with(date.getUTCMinutes(), '00') ;

};

// ## Bi-directional map

// ** BiMap(map) **
//
// class that allow to maintain forward reference from key to value,
// as well inverse as from value to key. If values are not unique,
// it will be mapped to only one of the keys. Changes to `BiMap`
// will be reflected in underlying `map` object as well. It is better
// to use strings both as keys and values, because object keys casted
// to strings, and we use values as keys in inverse mapping too.
// ```
// > var o = {}
// > var bm = u$.BiMap(o)
// > bm.put(5,3)
// > bm.key(3)
//  "5"
// > bm.get(5)
//  3
// > bm.values()
//  ["3"]
// > bm.keys()
//  ["5"]
// > bm.put("x","3")
// > bm.keys()
//  ["5", "x"]
// > bm.values()
//  ["3"]
// > bm.key(3)
//  "x"
// > bm.del("x")
// > bm.key(3)
//  "5"
// ```
u$.BiMap=function(map) {
  if( ! (this instanceof u$.BiMap) ){
    return new u$.BiMap(map);
  }
  var forward = map || {};
  var _inverse = null;
  function inverse(){
    if( _inverse === null ){
      _inverse = {};
      for ( var key in forward) {
        if (forward.hasOwnProperty(key)) {
          _inverse[forward[key]]=key;
        }
      }
    }
    return _inverse;
  }
  //`get(key)` - get value by key
  this.get =    function(key) { return forward[key]; };
  //`key(val)` - get key by value
  this.key =    function(val) { return inverse()[val]; };
  //`put(key,val)` - store key-value pair
  this.put =    function(key,val) { forward[key] = val; _inverse = null; };
  //`del(key)` - delete key-value pair by key
  this.del =    function(key) { delete forward[key];_inverse = null; };
  //`keys()` - get all keys
  this.keys =   function() { return Object.keys(forward); };
  //`values()` - get all distinct values
  this.values = function() { return Object.keys(inverse()); };
};

// ## Stuff should be thrown away but I am reactant for  some reason

// Tokenizer
u$.Tokenizer=function(s, delimiters) {
  var i = 0;

  function isValueChar() {
    return delimiters.indexOf(s.charAt(i)) < 0;
  }

  function next(condition) {
    var start = i;
    while (i < s.length && condition()){
      i++;
    }
    return s.substring(start, i);
  }

  return {
    getText : function() {
      return s;
    },
    nextValue : function() {
      return next(isValueChar);
    },
    nextDelimiter : function() {
      return next(function() {
        return !isValueChar();
      });
    },
    toString : function() {
      return s.substring(0, i) + " <-i-> " + s.substring(i);
    },
    getPosition : function() {
      return i;
    },
    setPosition : function(_i) {
      i = _i;
    }
  };
};

//** splitUrlPath(urlpath) **
//
// spit url path on path elements, and variables.
//
u$.splitUrlPath=function(urlpath) {
  var path = urlpath.split("/");
  var last = path[path.length-1].split('?');
  var result = {
    path: path ,
    variables: {},
    toString: function(){
      var vars = '' ;
      var sep = '?' ;
      for ( var k in this.variables) {
        if (this.variables.hasOwnProperty(k)) {
          vars += sep + k + '=' + encodeURI(this.variables[k]);
          sep = '&';
        }
      }
      return this.path.join('/') + vars;
    }
  };
  if( last.length === 2 ){
    path[path.length-1] = last[0];
    last[1].split("&").forEach(function(part) {
      var item = part.split("=");
      if( item[0].length > 0 ){
        result.variables[item[0]] = decodeURIComponent(item[1]);
      }
    });
  }else if(last.length > 2){
    throw 'Unexpected number of "?" in url :' + urlpath ;
  }
  return result;
};

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

u$.types = {} ;

function Type(name, props) {
  this.name = name ;
  this.is = props.is ;
  this.from_string = props.from_string ;
  this.notnull_to_string = props.notnull_to_string || u$.ensureString ;
  this.to_string = props.to_string || function (v){
        return u$.isNullish(v) ? "" : this.notnull_to_string(v) ;
      };
  this.missing = props.missing || _.isNull;
  this.order = props.order || generic_order;
  this.compare = u$.orderNullsFirst(this.order);
  u$.types[name] = this;
}

u$.Type = Type;

// ** orderChain(array) **
//
// Create chain of order functions.
u$.orderChain = function(){
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
u$.orderPredicateFirst = function (is) {
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

u$.indexOrder = function (valueOrder, valueArray) {
  return function(a, b) {
    return valueOrder(valueArray[a],valueArray[b]);
  };
};

// ** extractValuesByIndex (indexArray, valueArray)**
//
// extract values out of `valueArray` usinf `indexArray`
u$.extractValuesByIndex = function (indexArray, valueArray) {
  return indexArray.map(function(idx){return valueArray[idx];});
};

// ** createIndex(valueArray) **
//
// returns index array matching `valueArray`
u$.createIndex = function (valueArray) {
  return _.range(valueArray.length);
};
// **orderInverse(f)**
//
// inverse order mandated by `f(a,b)`
u$.orderInverse = function(f) {
  return function(a, b) {
    return f(b, a);
  };
};
//** orderNullsFirst(orderFuncArray) **
//
// Create order function that sort `undefined` - first, `null` - second
// and then according to order functions provided in argument.
u$.orderNullsFirst = function(){
  var funcs = u$.extractArray(arguments);
  funcs.splice(0,0,u$.orderPredicateFirst(_.isUndefined));
  funcs.splice(1,0,u$.orderPredicateFirst(_.isNull));
  return u$.orderChain(funcs);
};
// ** addTypes(typesMap) **
//
//    add types
u$.addTypes=function(typesMap){
  for(var typeName in typesMap){
    if( typesMap.hasOwnProperty(typeName) ){
      new Type(typeName,typesMap[typeName]);
    }
  }
};

var NANs = ["","NaN","null"];

var BOOLEAN_STRINGS = [
  "0","1","n","y","f","t",
  "no","yes","false","true"];

u$.addTypes({
// ** string ** type
  string: {
    is: _.isString,
    missing: function(s) { return u$.isNullish(s) || s === '' ; },
    from_string: function(v){
      return "" === v ? null : v ;
    }
  },
// ** number ** type
  number: {
    is: _.isNumber,
    missing: isNaN,
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
      if(''===v){
        return null;
      }
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
    from_string: function (v) {
      return v === '' ? null : u$.datetime_from_string(v);
    },
    notnull_to_string: u$.date_to_string_fn("YYYY_MM_DD_hh_mm_ss"),
    order: function(a, b) {
      return generic_order( a.valueOf(), b.valueOf());
    }
  },
// ** date ** type
  date: {
    is: _.isDate,
    from_string: function (v) {
      return v === '' ? null : u$.date_from_string(v);
    },
    notnull_to_string: u$.date_to_string_fn("YYYY_MM_DD"),
    order: function(a, b) {
      return generic_order( a.valueOf(), b.valueOf());
    }
  }
});

// ** detect_possible_array_types(str_array) **
//
// takes `str_array` and detect other possible array
// types from values

u$.detect_possible_array_types=function(str_array){
  var options={
    string: { array: str_array, hasMissing: false , type: 'string'}
  };
  var eligible_types = ['date','datetime','boolean','number'] ;
  eligible_types.forEach(function(type){
    options[type] = { array: [] , hasMissing: false , type: type } ;
  });
  str_array.forEach(function(v,i){
    if( u$.types.string.missing(v) ){
      options['string'].hasMissing = true;
    }
    for(var i = 0 ; i < eligible_types.length ; ){
      var typeName = eligible_types[i];
      var type = u$.types[typeName];
      var parsed = type.from_string(v);
      if( type.missing(parsed) ){
        options[typeName].hasMissing = true;
      }
      if( _.isUndefined(parsed) ){
        delete options[typeName];
        eligible_types.splice(i,1);
      }else{
        options[typeName].array.push(parsed);
        i++;
      }
    }
  });
  return options;
};

var PRIORITIES = [ 'number', 'date', 'datetime', 'boolean', 'string' ];

u$.choose_column_type=function(ops){
  var keys = Object.keys(ops);
  if(keys.length == 1){
    return ops[keys[0]];
  }else{
    for(var i = 0 ; i < PRIORITIES.length ; i++) {
      if (ops.hasOwnProperty(PRIORITIES[i])) {
        return ops[PRIORITIES[i]];
      }
    }
  }
};


