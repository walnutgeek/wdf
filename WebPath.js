(function() {
    "use strict";
    var u$ = require("./utils");
    var cacheit = require("./cacheit");

    //subset of mime-db, 1.3k instead of 139k
    var ext2mime = require("./ext2mime.json");

    var _ = require("lodash/lang");

    var SEARCH_TYPES = {
        'R': function(pattern){
                return new RegExp(pattern);
        },//regex case sensitive
        'r': function(pattern){
            return new RegExp(pattern,'i');
        },//regex case insensitive
        'S': function(pattern){
            return {
                test: function(s){
                    return s.indexOf(pattern) > -1;
                }};
        },//contains
        's': function(pattern){
            var low_pattern = pattern.toLowerCase();
            return {
                test: function (s) {
                    return s.toLowerCase().indexOf(low_pattern) > -1;
                }};
        }};//contains case insensetive

    function Search(s) {
        if( ! SEARCH_TYPES.hasOwnProperty(s[0])) {
            throw u$.error({ msg:'no such search type',
                type: s[0], allowed:Object.keys(SEARCH_TYPES) } );
        }
        this.type = s[0];
        this.pattern = s.substring(1);
        this.matcher = SEARCH_TYPES[this.type](this.pattern);
    }

    Search.prototype.toString=function(){
        return this.type + this.pattern;
    };
    Search.prototype.test=function(s){
      return this.matcher.test(s);
    };

    function check(c, allowed){
        if(allowed.indexOf(c) < 0){
            throw u$.error({msg:'not allowed',
                provided:c, allowed:allowed});
        }
        return c;
    }
    function Field(s){
        this.and_or = 'A';
        this.show_hide = 'S';
        this.accending_descending = null ;
        this.sort_index = null ;
        this.searches = null;
        if( _.isString(s) && s !== "" ){
            this.and_or = check(s[0],['A','O']);
            this.show_hide = check(s[1],['S','H']);
            var i = 2;
            if(['A','D'].indexOf(s[i]) > -1){
                this.accending_descending = s[i];
                while( ++i < s.length && s[i] >= '0' && s[i] <= '9');
                this.sort_index = +s.substring(3,i);
            }
            var search_array = [] ;
            var next_search = '' ;
            for( ; i < s.length ; i++){
                var c = s[i], nc = s[i+1];
                if(c === ',' ){
                    if( nc === ',' ){
                        i++;
                        next_search+=c;
                    }else{
                        search_array.push(new Search(next_search));
                        next_search = '';
                    }
                }else{
                    next_search+=c;
                }
            }
            if(next_search.length){
                search_array.push(new Search(next_search));
            }
            if(search_array.length){
                this.searches = search_array;
            }
        }
    }
    function escape_commas(s){
        if( s.indexOf(',') < 0){
            return s;
        }
        var copy = '', c;
        for(var i = 0 ; i < s.length; i++){
            c = s[i];
            copy +=  c ;
            if( c == ',' ){
                copy += c ;
            }
        }
        return copy;
    }

    Field.prototype.test = function(s){
      if( !this.searches ){
        return true;
      }
      var i;
      if(  this.and_or === 'A' ){
        for(i = 0 ; i < this.searches.length; i++ ){
          if( !this.searches[i].test(s) ){
            return false;
          }
        }
        return true ;
      }else{
        for(i = 0 ; i < this.searches.length; i++ ){
          if( this.searches[i].test(s) ){
            return true;
          }
        }
        return false;
      }
    };

    Field.prototype.toString = function(){
        var s = this.and_or + this.show_hide;
        if( this.accending_descending && _.isNumber(this.sort_index) ){
            s += this.accending_descending + this.sort_index;
        }
        if(this.searches && this.searches.length){
            for(var i = 0 ; i < this.searches.length; i++){
                if(i) s += ',';
                s += escape_commas(this.searches[i].toString());
            }
        }
        return s === 'AS' ? undefined : s;
    };

    function Params(input){
      var self = this ;
      input = input || '';
      input.split('&').forEach(function(s){
        if(s){
          var key_val = s.split('=',2);
          self[key_val[0]] = new Field(decodeURIComponent(key_val[1]));
        }
      });
    }

    Params.prototype.toString=function(){
      var s = '';
      for (var key in this) {
        if (!this.hasOwnProperty(key) ) continue;
        var v = this[key].toString() ;
        if( v ){
          if( s ){
            s += '&' ;
          }
          s += key + '=' +  encodeURIComponent(v) ;
        }
      }
      return s ;
    };

    function WebPath(input){
      function check_name(name){
        if(name === '.' || name === '..' || name.indexOf('/') > -1 ){
          throw u$.error({message: "path cannot include relative directory references"})
        }
        return name;
      }
      try{
        if( _.isPlainObject(input) ){
          this.name = check_name(input.name);
          this.parent = input.parent;
          this.dir = input.dir;
        }else{
          var array = input ;
          if(_.isString(input)){
              var posParams = input.indexOf('?');
              if(posParams >= 0){
                  this.params =  new Params(input.substring(posParams+1));
                  input = input.substring(0,posParams);
              }
              array = input.split('/');
              this.name = check_name(array.pop());

              if( this.name === "" ){
                  this.name = check_name(array.pop());
                  this.dir = true ;
              }
          }else{
              // if it is not string that it is recursive call
              // to init parent chain
              this.name = check_name(array.pop()) ;
              this.dir = true;
          }
          this.parent = array.length > 0 ?  new WebPath(array) : null ;
        }
      }catch(e){
        throw u$.error({input:input},e);
      }
    }

  WebPath.prototype.child=function(name,dir){
    if( !this.dir ){
      throw u$.error('only directory can have children');
    }else{
      return new WebPath({
        parent: this,
        name: name,
        dir: dir});
    }
  };

  WebPath.prototype.link=cacheit('_link', function(){
    return new u$.Link(this.path(), this.name);
  });

  WebPath.prototype.extension=cacheit('_ext', function(){
    if( this.dir ){
      return '/';
    }else{
      for( var i = this.name.length - 1 ; i > 0 ; i-- ){
        if(this.name[i] === '.' ){
          return this.name.substr(i+1).toLowerCase();
        }
      }
      return null;
    }
  });

    WebPath.prototype.mime=cacheit('_mime', function(){
       return ext2mime[this.extension()] || ext2mime['*'];
    });

    WebPath.prototype.isRoot=function(){
        return this.parent === null;
    };

    WebPath.prototype.path=cacheit('_path', function(){
        return  (this.isRoot() ?  this.name  :  this.parent.path() +  this.name) +
            (this.dir ? '/' : '');
    });

    WebPath.prototype.enumerate=function(input){
        input = input || [];
        input.splice(0,0,this);
        if(this.parent){
            this.parent.enumerate(input);
        }
        return input;
    };
    WebPath.prototype.toString=function(){
        if(this.params){
            return this.path() + '?' + this.params.toString() ;
        }
        return this.path() ;
    };
    WebPath.ensurePath = function(path_or_str){
      return ( path_or_str instanceof WebPath
          ? path_or_str
          : (u$.isNullish(path_or_str)
              ? null
              : new WebPath(path_or_str))
      );
    };

    WebPath.Search = Search ;
    WebPath.Params = Params ;
    WebPath.Field = Field ;
    module.exports = WebPath;
})();

