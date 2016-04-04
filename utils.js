//  misc utilities. Initialize it like:
//  ```
//    var u$ = requre("wdf/utils");
//  ```

(function() {
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
        function(f){return f(a);});
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

// **isStringNotEmpty(s)**
//
// returns `true` if `s` contains some non-whitespace charcters
  u$.isStringNotEmpty=function(s){
    return _.isString(s) &&  s.trim().length > 0;
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
    return new (Function.prototype.bind.apply(constructor, a))();
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

  var SORTING = [ 'ASCENDING', 'DESCENDING' , 'ASC', 'DESC', 'A', 'D' ];
  
  u$.sorting = function(sort_var){
    /*
    @param sort_var string or number
    @return number
      sort index: 0 - for ascending, 1 - for descending, if
     */
    if( +sort_var === 0 || +sort_var === 1)
      return sort_var;
    if( _.isBoolean(sort_var) )
      return sort_var ? 1 : 0 ;
    var idx = SORTING.indexOf(sort_var);
    if(idx > -1)
      return idx % 2;
    return 0 ;
  }

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
    mapper = mapper || _.identity;
    var min = 0;
    var max = array.length - 1;
    var mid, r;
    while (min <= max) {
      mid = ((min + max) / 2) | 0;
      r = comparator(searchFor, mapper(array[mid]));
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
    toValue = toValue || _.identity ;
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
    return u$.isNullish(a) ? "" : _.isString(a) ? a : String(a);
  };


//**error(params,err)**
//
//creates Error object if not provided and add
// stringified params to err.stack to stack trace.
  u$.error=function(params,  err) {
    if( _.isString(params) ){
      params = { msg: params};
    }else{
      params = params || {};
    }
    if(!err){
      function mk_err(key){
        var msg = params[key];
        if(msg){
          delete params[key];
          return new Error(msg);
        }
      }
      err = mk_err('msg') || mk_err('message') || new Error();
    }
    if( _.size(params) ){
      var stack = err.stack.split('\n');
      stack.splice(1,0,JSON.stringify(params));
      err.stack = stack.join('\n') ;
    }
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
//jail(fn)
//exception jail
  u$.jail = function(fn){
    try{
      return fn();
    }catch(ignored){
      return ignored;
    }
  };
  u$.ensurePlainObject = function(o){
    try{
      if(_.isString(o)){
        o = JSON.parse(o);
      }
      if(_.isPlainObject(o) || u$.isNullish(o)) {
        return o;
      }
    }catch(ignored){}
    return undefined;
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
    YYYY_MM_DDThh_mm_ss_zzzZ: { delims: ['-','-','T',':',':','.','Z'] }, //ISO-8601
    YYYY_MM_DDThh_mm_ss_zzz:  { delims: ['-','-','T',':',':','.'] },
    YYYY_MM_DD_hh_mm_ss_zzz:  { delims: ['-','-',' ',':',':','.'] },
    YYYY_MM_DDThh_mm_ss:      { delims: ['-','-','T',':',':'] },
    YYYY_MM_DD_hh_mm_ss:      { delims: ['-','-',' ',':',':'] },
    YYYYMMDD_hhmmss:          { delims: ['','','-','',''] },
    YYYYMMDDhhmmss:           { delims: ['','','','',''] },
    YYYY_MM_DD:               { delims: ['-','-'] },
    YYYYMMDD:                 { delims: ['',''] },
  };

//prepare text for regexp
  var DATE_FIELD_SIZES = [4,2,2,2,2,2,3];
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
    var s = '^';
    for (var i = 0; i < n; i++) {
      if(i>0){
        s += o.delims[i-1];
      }
      var p = pattern_texts[i];
      if( p )
        s += p;
    }
    s+='$';
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
        var args = [];
        for(var i = 1 ; i < m.length ;i++){
          args[i-1] = +m[i] ;
        }
        args[1]--;
        return new_date(in_utc, args);
      }
    }
    return undefined;
  }

//### Public Date stuff



//** date_from_string(s)**
//
// parse string into date assuming UTC timezone
//   * `s` -
//   * `precision` -  date precision in mills
//   * `strict` - if true, dates that does not
//      exactly match precision will be undefined

  u$.date_from_string=function(s,precision,strict){
    precision = precision || 1;
    var dt = parse_date(true, s);
    if( _.isDate(dt) ){
      var v = dt.getTime();
      var d = v % precision ;
      if ( d === 0 ) {
        return dt;
      }else if( !strict ){
        return new Date(v-d);
      }
    }
    return undefined;
  };


//**date_components(d)**
//
// split Date object into array of components :
// [year, month(1-12), day, hours, minutes, seconds]
// in local time
  u$.date_components=function(d){
    return [d.getFullYear(),d.getMonth() + 1,d.getDate(),
      d.getHours(),d.getMinutes(),d.getSeconds(),d.getMilliseconds()];
  };

//**utc_components(d)**
//
// split Date object into array of components :
// [year, month(1-12), day, hours, minutes, seconds]
// in UTC time
  u$.utc_components=function(d){
    return [d.getUTCFullYear(),d.getUTCMonth() + 1,d.getUTCDate(),
      d.getUTCHours(),d.getUTCMinutes(),d.getUTCSeconds(),d.getUTCMilliseconds()];
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
        if( i < d_values.length ){
          s += pad_with_zeros(d_values[i],DATE_FIELD_SIZES[i]);
        }
      }
      return s;
    };
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

// Collect `sum`, `count`, `min` and `max` for multiple
// sets of observations. Sets are identified  by `key` and maintainde
// in `store` object during data collection.
// ```
// > store = {}
// > collect_stats('a', 1, store)
// > collect_stats('a', 2, store)
// > collect_stats('b', -1, store)
// > collect_stats('a', 5, store)
// > collect_stats('b', 1, store)
// > store
// { a: { count: 3, sum: 8, min: 1, max: 5 },
//   b: { count: 2, sum: 0, min: -1, max: 1 } }
// > store.a.sum/store.a.count
// 2.6666666666666665
// ```
  u$.collect_stats = function(key, val, store){
    if( store.hasOwnProperty(key) ){
      var entry = store[key];
      entry.count ++;
      entry.sum += val;
      if( entry.min > val ) entry.min = val ;
      if( entry.max < val ) entry.max = val ;
    }else{
      store[key] = {count: 1 , sum:val , min: val, max: val};
    }
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
  u$.generic_order = function (a,b){
    return a === b ? 0 : a < b ? -1 : 1 ;
  };

  u$.no_order = function (a,b){
    return 0 ;
  };

  u$.orderChain = function(){
    /*
    @param funcs array of functions
      order functions that need to be chained
    @return cumulative order function
     */
    var funcs = u$.extractArray(arguments);
    return function(a,b){
      var rc = 0;
      for (var i = 0; i < funcs.length; i++) {
        var res = funcs[i](a,b);
        if( res ){
          rc = res;
          break;
        }
      }
      return rc;
    };
  };
  u$.orderWithResolver = function(order,valueMapper){
    /*
     @param order function(v1,v2):cmp
       function that operate on values
       that not directly available for
       comparison
     @param valueMapper function(x):v
       function that map values available
       for comparison to what `order` function
       can accept.
     @return cumulative order function
     */
    return function(a,b){
      return order(valueMapper(a),valueMapper(b));
    };
  };

  u$.orderPredicateFirst = function (is) {
    /*
     Turn predicate function(returning `true` or `false`) into
     order function. Order function place `true` first.
     */
    return function(a, b) {
      return is(a) ? (is(b) ? 0 : -1) : (is(b) ? 1 : 0);
    };
  };


  u$.orderInverse = function(f) {
// inverse order mandated by `f(a,b)`
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
    funcs.splice(0,0,
        u$.orderPredicateFirst(_.isUndefined),
        u$.orderPredicateFirst(_.isNull),
        u$.orderPredicateFirst(isNaN));
    return u$.orderChain(funcs);
  };

  u$.types = {} ;

  function Type(name, props) {
    _.assign(this,props);
    this.mixin_type = function(){
      return this.mixin ? this.mixin.type : undefined;
    };
    var mixin = this.mixin_type();
    if(mixin){
      _.defaults(this,mixin);
    }
    this.name = name ;
    _.defaults(this, {
        order:      u$.generic_order,
        missing:    _.isNull,
        to_json:    _.identity,
        coerce:     function(value,from_type){
          if(this.is(value)){
            return value;
          }
          from_type = from_type || u$.findTypeByValue(value);
          var property_to = "to_" + this.name;
          if( from_type.hasOwnProperty(property_to) ){
            return from_type[property_to](value);
          }

          var property_from = "from_" + from_type.name;
          if( this.hasOwnProperty(property_from) ){
            return this[property_from](value);
          }
          var mixin = this.mixin_type();
          if( mixin && mixin === from_type.mixin_type() ){
            return this.mixin_coerce(value,from_type);
          }
          var s = from_type.to_string(value);
          return this.from_string(s);
        },
        _to_string: u$.ensureString,
        to_string: function (v){
          return _.isNull(v) ? "" : this._to_string(v);
        }
    });
    this.compare = u$.orderNullsFirst(this.order);
  }

  // reevaluate type conversion graph.
  // called everytime when `addTypes()` called.
  Type.prototype.init=function(){
    this.to = {};
    this.from = {};

  };
  // Link object, associate name with resource location
  //   * `href` - url or path
  //   * `name` - name of resource
  function Link(href,text){
    this.text = text || '';
    this.href = href ;
  }


  // convert into string using markdown sintax
  // like `[This link](http://example.net/)`
  Link.prototype.toString = function(){
    return "["+this.text+"]("+this.href+")" ;
  };

  Link.parse=function(md_link){
    if(md_link === null || md_link === ''){
      return null;
    }
    if(md_link && md_link.constructor === Link){
      return md_link;
    }
    var position = 1;
    if(md_link[0] === '['){
      var l = md_link.length - 1 ;
      if( md_link[l] === ')' ){
        while( position < l ){
          if( md_link[position] === ']' &&
              md_link[position+1] === '(' ){
            return new Link( md_link.substring(position+2,l),
                md_link.substring(1,position));
          }
          position++;
        }
      }
    }
    return undefined;
  };

  u$.Link = Link;

  u$.Type = Type;

// ** addTypes(typesMap) **
//
//    add types
  u$.addTypes=function(typesMap){
    for(var typeName in typesMap){
      if( typesMap.hasOwnProperty(typeName) ){
        u$.types[typeName] = new Type(typeName,typesMap[typeName]);
      }
    }
    for(typeName in u$.types){
      if( u$.types.hasOwnProperty(typeName) ){
        u$.types[typeName].init();
      }
    }
  };

  var NANs = [null,"","NaN","null"];

  var BOOLEAN_STRINGS = [
    "0","1","n","y","f","t",
    "no","yes","false","true"];

  var MILLS_IN_DAY = 24 * 60 * 60 * 1000;
  var MILLS_IN_SEC = 1000;

  var date_mixin = {
    is: function(v){
      return _.isDate(v) && (v.getTime() % this.mixin.precision) === 0 ;
    },
    from_string: function (v,strict) {
      return u$.isNullish(v) || v === '' ? null : u$.date_from_string(v,this.mixin.precision,strict);
    },
    _to_string: function(dt){
      return u$.date_to_string_fn(this.mixin.pattern)(dt);
    },
    from_number: function (v) {
      return isNaN(v) || u$.isNullish(v) ? null : new Date( v - v % this.mixin.precision);
    },
    to_number: function(dt){
      return u$.isNullish(dt) ? NaN : dt.getTime();
    },
    order: function (a, b) {
      return u$.generic_order( a.getTime(), b.getTime());
    },
    mixin_coerce: function(value,from_type){
      return this.from_number(from_type.to_number(value));
    },
    to_json: function(v){
      return _.isNull(v) ? null : this.to_string(v);
    },
  };

  u$.addTypes({
// ** number ** type
    number: {
      is: _.isNumber,
      missing: isNaN,
      from_string: function(v){
        return NANs.indexOf(v) > -1 ? NaN :  u$.numDefault(+v,undefined);
      },
      _to_string: function(v){
        return isNaN(v)? '' : String(v);
      },
    },
// ** link ** type
// `[This link](http://example.net/)`
    link: {
      is: function(l){ return l instanceof Link; },
      missing: _.isNull,
      from_string: Link.parse,
      to_json: function(v){
        return _.isNull(v) ? null : this.to_string(v);
      },
      order: function(a, b) {
        var rc = u$.generic_order(a.href, b.href);
        if( ! rc ) rc = u$.generic_order(a.text, b.text);
        return rc || 0;
      }
    },
    json: {
      is: _.isPlainObject,
      missing: _.isNull,
      from_string: u$.ensurePlainObject,
      to_json: _.identity ,
      order: u$.no_order,
    },
// ** date ** type
    date: {
      mixin: {
        type: date_mixin,
        precision: MILLS_IN_DAY,
        pattern: "YYYY_MM_DD"
      }
    },
// ** datetime ** type
    datetime: {
      mixin:{
        type: date_mixin,
        precision: MILLS_IN_SEC,
        pattern: "YYYY_MM_DD_hh_mm_ss"
      }
    },
// ** timestamp ** type
    timestamp: {
      mixin:{
        type: date_mixin,
        precision: 1,
        pattern: "YYYY_MM_DD_hh_mm_ss_zzz"
      }
    },
// ** boolean ** type
    boolean: {
      is: _.isBoolean,
      from_string: function(v,strict){
        if(_.isNull(v) || ''===v){
          return null;
        }
        if(_.isString(v)) {
          var idx = BOOLEAN_STRINGS.indexOf(v.toLowerCase());
          if (idx >= 0) {
            return idx % 2 === 1;
          }
        }
        if(!strict){
          var n = +v;
          if( !isNaN(n) ) {
            return Math.abs(n) > 1e-8;
          }
        }
        return undefined;
      },
      to_number: function(b){
        return u$.isNullish(b) ? NaN : +b;
      },
      order: function(a, b) {
        return a ? (b ? null : 1) : (b ? -1 : null);
      }
    },
// ** string ** type
    string: {
      is: _.isString,
      missing: function(s) { return u$.isNullish(s) || s === '' ; },
      from_string: function(v){
        return "" === v ? null : v ;
      }
    },
  });

// ** detect_possible_array_types(str_array) **
//
// takes `str_array` and detect other possible array
// types from values

  u$.detect_possible_array_types=function(str_array){
    var options={
      string: { array: str_array, hasMissing: false , type: u$.types.string}
    };
    var eligible_types = Object.keys(u$.types).filter(function(n){
      return !options.hasOwnProperty(n);
    });
    eligible_types.forEach(function(typeName){
      options[typeName] = {
        array: new Array(str_array.length) ,
        hasMissing: false ,
        type: u$.types[typeName] } ;
    });
    str_array.forEach(function(v,row){
      if( u$.types.string.missing(v) ){
        options.string.hasMissing = true;
      }
      for(var i = 0 ; i < eligible_types.length ; ){
        var typeName = eligible_types[i];
        var opt = options[typeName];
        var parsed = opt.type.from_string(v,true /*strict*/);
        if( opt.type.missing(parsed) ){
          opt.hasMissing = true;
        }
        if( _.isUndefined(parsed) ){
          delete options[typeName];
          eligible_types.splice(i,1);
        }else{
          opt.array[row] = parsed;
          i++;
        }
      }
    });
    return options;
  };

  u$.findTypeByValue=function(v){
    for(var typeName in u$.types){
      if(u$.types.hasOwnProperty(typeName)){
        var type = u$.types[typeName];
        if (type.is(v)) {
          return type;
        }
      }
    }
    return u$.types.string;
  };

  u$.choose_column_type=function(ops){
    var keys = Object.keys(ops);
    if(keys.length == 1){
      return ops[keys[0]];
    }else{
      for(var typeName in u$.types){
        if (ops.hasOwnProperty(typeName)) {
          return ops[typeName];
        }
      }
    }
  };

// **ensureType(typeOrName)**
//
// returns type for name, or pass through type
  u$.ensureType=function(typeOrName){
    return typeOrName instanceof Type ? typeOrName : u$.types[typeOrName];
  };

})();


