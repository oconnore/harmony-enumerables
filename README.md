# Harmony-Enumerables for Node.js

[![Build Status](https://secure.travis-ci.org/oconnore/harmony-enumerables.png?branch=master)](http://travis-ci.org/oconnore/harmony-enumerables)

## What is this?

  A small polyfill for ES6 collections that leverages non-enumerable Node.js Map/WeakMap where possible. It's designed to leverage the incomplete --harmony Map/Set/WeakMap implementation where possible, while adding iterators. In vanilla node, or Chrome, Map, Set, and WeakMap are polyfilled.

  Unsuprisingly, the polyfill does some weird stuff. Specifically, it creates random, non-enumerable properties on your objects. If you don't like that, that's fine, just use one of the other, less imposing ES6 polyfills for Map, Set, and WeakMap.

For example:

```javascript
var eSet = require('harmony-enumerables').Set;

var s = new eSet();
s.add({value: 2});
s.add({value: 3});
s.add({value: 4});

var x = 0;
s.forEach(function(y) {
  x += y.value;
})

assert.equal(x, 9); // true
```

In addition to forEach, it also adds an iterator interface:

```javascript
var eMap = require('harmony-enumerables').Map;
var m = new eMap();
m.set(18, 2);
m.set(34, 3);
m.set(76, 4);

var x = 0;
var iter = m.entries();
while (!iter.done) {
  var keyValue = iter.next();
  var key = keyValue[0];
  var value = keyValue[1];
  x += value;
}

assert.equal(x, 9); // true
```

if you call .polyfill(), it will overwrite the global definitions.
```javascript
require('harmony-enumerables').polyfill();
```

