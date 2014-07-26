(function (root, factory) {
  // Feature detect
  var needPolyfill = false, needEnumerable = false;
  if (typeof Map === 'undefined' || typeof WeakMap === 'undefined') {
    needPolyfill = true;
    needEnumerable = true;
  }
  if (!needPolyfill && typeof Map.prototype.forEach !== 'function') {
    needEnumerable = true;
  }
  // Do imports
  if (needEnumerable) {
    if (typeof define === 'function' && define.amd) {
      if (needPolyfill) {
        define(['./polyfill'], factory);
      } else {
        define([], factory);
      }
    } else if (typeof exports === 'object') {
      if (needPolyfill) {
        module.exports = factory(require('./polyfill'));
      } else {
        module.exports = factory(null);
      }
    } else {
      root.Collections = factory(root.PolyFillCollections);
    }
  } else {
    var exp = {
      WeakMap: WeakMap,
      Map: Map,
      Set: Set,
      polyfill: function(){}
    };
    if (typeof define === 'function' && define.amd) {
      define([], function() { return exp; });
    } else if (typeof exports === 'object') {
      module.exports = exp;
    } else {
      root.Collections = exp;
    }
  }
}(this, function (polyfill) {
  'use strict';
  var rWeakMap, rMap;
  if (typeof Map === 'undefined') {
    rMap = polyfill.PMap
  } else {
    rMap = Map;
  }
  if (typeof WeakMap === 'undefined') {
    rWeakMap = polyfill.WeakMap;
  } else {
    rWeakMap = WeakMap;
  }

  var priv = new rWeakMap();

  function concatD(list, args) {
    for (var i = 1; i < arguments.length; i++) {
      var nlist = arguments[i];
      Array.prototype.push.apply(list, nlist);
    }
    return list;
  };

  // A doubly linked node
  function Node(value, prev, next) {
    this.value = value;
    this.prev = prev;
    this.next = next;
  }

  function Iterator(seq, pos, fn) {
    this.cur = seq;
    this.pos = pos;
    this.fn = fn;
  }
  Object.defineProperty(Iterator.prototype, 'done', {
    get: function() {
      return !this.cur;
    }
  });
  Iterator.prototype.next = function() {
    if (!this.done && this.cur) {
      var tmp = this.cur, ret;
      this.cur = this.cur.next;
      if (typeof this.pos === 'number') {
        ret = tmp.value[this.pos];
      } else {
        ret = tmp.value;
      }
      return this.fn ? this.fn(ret) : ret;
    }
  };

  // A Sequence is a doubly linked list where the conses
  // are also stored in a Map and accessible by a key.
  function Sequence(iterable) {
    this.sequence = null;
    this._size = 0;
    this.nodeMap = new rMap();
    if (iterable) {
      if (typeof iterable.length === 'number') {
        for (var i = 0; i < iterable.length; i++) {
          this.add.apply(this, iterable[i]);
        }
      } else if (typeof iterable.entries === 'function') {
        var it = iterable.entries();
        while (!it.done) {
          var tmp = it.next();
          this.add.apply(this, tmp);//it.next());
        }
      }
    }
  }
  Sequence.prototype = {
    constructor: Sequence,
    clear: function clear() {
      this.sequence = null;
      this._size = 0;
      this.nodeMap = new rMap();
    },
    get size() {
      return this._size;
    },
    add: function set(key, value) {
      if (!this.nodeMap.has(key)) {
        var node = new Node([key, value], null, this.sequence);
        if (this.sequence) {
          this.sequence.prev = node;
        }
        this.sequence = node;
        this.nodeMap.set(key, node);
        this._size++;
      } else {
        var node = this.nodeMap.get(key);
        node.value = [key, value];
      }
    },
    has: function has(key) {
      return this.nodeMap.has(key);
    },
    get: function get(key) {
      if (this.nodeMap.has(key)) {
        return this.nodeMap.get(key).value[1];
      }
    },
    delete: function _delete(key) {
      if (this.nodeMap.has(key)) {
        var node = this.nodeMap.get(key);
        var prev = node.prev, next = node.next;
        if (prev) {
          prev.next = next;
        }
        if (next) {
          next.prev = prev;
        }
        if (this.sequence === node) {
          this.sequence = node.next;
        }
        this.nodeMap.delete(key);
        this._size--;
        return true;
      }
      return false;
    },
    iterator: function iterator(pos) {
      return new Iterator(this.sequence, pos);
    },
    keys: function() { return this.iterator(0); },
    values: function() { return this.iterator(1); },
    entries: function() { return this.iterator(); },
    forEach: function(caller, cb, thisArg) {
      // Map a Function `cb` over the entries
      if (typeof cb === 'function') {
        var iter = this.iterator();
        while (!iter.done) {
          var i = iter.next();
          cb.call(thisArg, i[1], i[0], caller);
        }
      }
    }
  };

  // bindHelper calls a function on our private internal Sequence.
  // It is used by EnumMap and EnumSet to delegate to the private
  // sequence object.
  function bindHelper(fn) {
    return function() {
      var p = priv.get(this);
      return fn.apply(p.sequence, Array.prototype.slice.call(arguments));
    }
  }

  // This is our poly-filled Map, which we can enumerate using Sequence
  function EnumMap(iter) {
    var p = {};
    priv.set(this, p);
    var newIter = iter;
    if(iter && typeof iter.entries === 'function') {
      if (iter instanceof EnumSet) {
        newIter = {
          entries: function() {
            var pi = priv.get(iter);
            return new Iterator(pi.sequence.sequence, 0);
          }
        };
      }
    }
    p.sequence = new Sequence(newIter);
  }
  EnumMap.prototype = {
    constructor: EnumMap,
    get size() {
      var p = priv.get(this);
      return p.sequence.size;
    },
    has: bindHelper(Sequence.prototype.has),
    get: bindHelper(Sequence.prototype.get),
    delete: bindHelper(Sequence.prototype.delete),
    clear: bindHelper(Sequence.prototype.clear),
    set: bindHelper(Sequence.prototype.add),
    keys: bindHelper(Sequence.prototype.keys),
    values: bindHelper(Sequence.prototype.values),
    entries: bindHelper(Sequence.prototype.entries),
    forEach: function() {
      var p = priv.get(this);
      Sequence.prototype.forEach.apply(p.sequence,
        concatD([this], arguments));
    }
  }

  // This is our poly-filled Set, which we can enumerate using Sequence
  function EnumSet(iter) {
    var p = {};
    priv.set(this, p);
    var newIter = iter;
    if (Array.isArray(iter)) {
      newIter = Array.prototype.map.call(iter, function(x) {
        return [x, x];
      });
    } else if(iter && typeof iter.entries === 'function') {
      if (iter instanceof EnumMap) {
        newIter = {
          entries: function() {
            var pi = priv.get(iter);
            return new Iterator(pi.sequence.sequence, undefined, function(x) {
              return [x, x];
            });
          }
        };
      }
    }
    p.sequence = new Sequence(newIter);
  }
  EnumSet.prototype = {
    constructor: EnumSet,
    get size() {
      var p = priv.get(this);
      return p.sequence.size;
    },
    has: bindHelper(Sequence.prototype.has),
    get: bindHelper(Sequence.prototype.get),
    delete: bindHelper(Sequence.prototype.delete),
    clear: bindHelper(Sequence.prototype.clear),
    add: (function() {
      var helper = bindHelper(Sequence.prototype.add);
      return function add(value) {
        helper.call(this, value, value);
      };
    })(),
    keys: bindHelper(Sequence.prototype.keys),
    values: bindHelper(Sequence.prototype.values),
    entries: bindHelper(Sequence.prototype.entries),
    forEach: function() {
      var p = priv.get(this);
      Sequence.prototype.forEach.apply(p.sequence,
        concatD([this], arguments));
    }
  }

  function dopolyfill() {
    if (typeof WeakMap === 'undefined') {
      WeakMap = rWeakMap;
    }
    // This code is not evaluated unless these are non-enumerable or undefined.
    Map = EnumMap;
    Set = EnumSet;
  }

  return {
    WeakMap: rWeakMap,
    Map: EnumMap,
    Set: EnumSet,
    polyfill: dopolyfill
  };
}));
