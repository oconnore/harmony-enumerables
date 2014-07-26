(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.PolyFillCollections = factory();
  }
}(this, function () {

  var bits = 128;
  var keylen = bits / 6;

  function randBase64(n) {
    var dict = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_',
        len = dict.length,
        a = ['h|'];
    for (var i = 0; i < n; i++) {
      a.push(dict[Math.floor(Math.random() * len)]);
    }
    return a.join('');
  }
  var randomKey = randBase64.bind(null, keylen);

  function hash(uniq, value) {
    var t = typeof value;
    switch (t) {
      case 'number':
        return 'n|'+value;
      case 'string':
        if (/^[a-z]\|/.exec(value)) {
          return 's|'+value;
        } else {
          return value;
        }
      case 'boolean':
        if (value) {
          return 't|';
        } else {
          return 'f|';
        }
      case 'undefined':
        return 'u|';
      case 'null':
        return 'z|';
      case 'object':
      case 'function':
        if (value.hasOwnProperty(uniq)) {
          return value[uniq];
        } else {
          var k = randomKey();
          Object.defineProperty(value, uniq, {
            value: k,
            enumerable: false,
            configurable: true,
            writable: true
          })
          return k;
        }
      case 'symbol':
      default:
        throw new Error('unsupported type '+t);
    }
  }

  function clearHash(uniq, value) {
    var t = typeof value;
    switch (t) {
      case 'object':
      case 'function':
        if (value.hasOwnProperty(uniq)) {
          delete value[uniq];
        }
      default:
        break;
    }
  }

  //
  // WeakMap Polyfill
  //

  function WeakMap() {
    this.key = randomKey();
  }
  WeakMap.prototype.constructor = WeakMap;
  Object.defineProperty(WeakMap.prototype, 'length', {
    get: function() { return 1; }
  });
  WeakMap.prototype.clear = function(){
    // This function necessarily leaks the stored properties on all weak keys
    this.key = randomKey();
  };
  WeakMap.prototype.delete = function(key) {
    clearHash(this.key, key);
  };
  WeakMap.prototype.get = function(key) {
    if (key.hasOwnProperty(this.key)) {
      return key[this.key];
    } else {
      return undefined;
    }
  };
  WeakMap.prototype.has = function(key) {
    return key.hasOwnProperty(this.key);
  };
  WeakMap.prototype.set = function(key, value) {
    if (this.has(key)) {
      key[this.key] = value;
    } else {
      Object.defineProperty(key, this.key, {
        value: value,
        enumerable: false,
        configurable: true
      });
    }
  };

  //
  // Base for Maps and Sets
  // Similar to the partial Map impl from 'node --harmony'
  //
  
  function PMap() {
    this.count = 0;
    this.keys = {};
    this.values = {};
    this.key = randomKey();
  }
  Object.defineProperty(PMap.prototype, 'length', {
    get: function() { return 1; }
  });
  Object.defineProperty(PMap.prototype, 'size', {
    get: function() { 
      return this.count;
    }
  });
  PMap.prototype.set = function(key, value) {
    var h = hash(this.key, key);
    if (!this.keys.hasOwnProperty(h)) {
      this.count++;
    }
    this.keys[h] = key;
    this.values[h] = value;
    return this;
  };
  PMap.prototype.get = function(key) {
    var h = hash(this.key, key);
    if (this.keys.hasOwnProperty(h)) {
      return this.values[h];
    } else {
      return undefined;
    }
  };
  PMap.prototype.has = function(key) {
    var h = hash(this.key, key);
    return this.keys.hasOwnProperty(h);
  };
  PMap.prototype.delete = function(key) {
    var h = hash(this.key, key);
    if (this.keys.hasOwnProperty(h)) {
      this.count--;
    }
    delete this.keys[h];
    delete this.values[h];
    clearHash(this.key, key);
  };
  PMap.prototype.clear = function() {
    for (var i in this.keys) {
      clearHash(this.key, this.keys[i]);
    }
    this.keys = {};
    this.values = {};
    this.key = randomKey();
    this.count = 0;
  }

  return {
    PMap: PMap,
    WeakMap: WeakMap
  };
}));

