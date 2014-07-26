(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([
      '../polyfill.js',
      '../node_modules/chai/chai.js'
    ], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(
      require('../polyfill'),
      require('chai')
    );
  } else {
    throw new Error('not supporting globals in tests');
  }
})(this, function(pol, chai, mocha) {
  'use strict';

  var PMap = pol.PMap;
  var lWeakMap = pol.WeakMap;

  var assert = chai.assert;

  suite('Polyfill', function() {

    suite('Test WeakMap', function() {
      test('Map a value', function() {
        var w = new lWeakMap();
        var a = [1,2,3];
        w.set(a, 42);
        assert.ok(w.has(a));
        a.push(4);
        assert.equal(w.get(a), 42);
        assert.equal(w.get([1,2,3]), undefined);
        assert.equal(w.get([1,2,3,4]), undefined);
      });
      test('Map a primitive -> fail', function() {
        var w = new lWeakMap();
        var count = 0;
        try {
          w.set(42, 42);
        } catch(e) {
          count++;
        }
        assert.equal(count, 1);
      });
      test('Delete value', function() {
        var w = new lWeakMap();
        var a = [1,2,3];
        w.set(a, 42);
        assert.ok(w.has(a));
        assert.equal(w.get(a), 42);
        w.delete(a);
        assert.ok(!w.has(a));
        assert.equal(w.get(a), undefined);
      });
      test('Clear values', function() {
        var w = new lWeakMap();
        var key = w.key;
        var a = [1,2,3];
        w.set(a, 42);
        w.clear();
        assert.ok(!w.has(a));
        assert.ok(a.hasOwnProperty(key));
        assert.notEqual(key, w.key);
      });
    });

    suite('Test PMap', function() {
      test('Create a PMap', function() {
        var c = new PMap();
        assert.ok(c);
      });
      test('Store primitives', function() {
        var c = new PMap();
        c.set(true, false);
        c.set(false, true);
        c.set(false, 8);
        c.set(11, 12);
        c.set(12, 13);
        c.set('hi', 'world');
        c.set('t|', 'world');
        assert.equal(c.size, 6);
        assert.equal(c.get(true), false);
        assert.equal(c.get(false), 8);
        assert.equal(c.get(11), 12);
        assert.equal(c.get(12), 13);
        assert.equal(c.get('hi'), 'world');
        assert.equal(c.get('t|'), 'world');
      });
      test('Store objects', function() {
        var c = new PMap();
        var x = {first: 'string'};
        var y = [1, 2, 3];
        var z = function testfn(a) { return a + 1; };
        c.set(x, y);
        c.set(y, z);
        c.set(z, x);
        x.second = 'wing';
        y.push(4);
        assert.equal(c.get(x), y);
        assert.equal(c.get(y), z);
        assert.equal(c.get(z), x);
        assert.equal(c.get(y)(42), 43);
      });
      test('Delete primitives', function() {
        var c = new PMap();
        c.set(true, false);
        c.set(11, 12);
        c.set('hi', 'world');
        assert.equal(c.size, 3);
        assert.equal(c.get(true), false);
        c.delete(true);
        assert.equal(c.size, 2);
        assert.equal(c.get(true), undefined);
        assert.equal(c.get(11), 12);
        c.delete(11);
        assert.equal(c.size, 1);
        assert.equal(c.get(11), undefined);
        assert.equal(c.get('hi'), 'world');
        c.delete('hi');
        assert.equal(c.size, 0);
        assert.equal(c.get('hi'), undefined);
      });
      test('Delete objects', function() {
        var c = new PMap();
        var key = c.key;
        var x = {first: 'string'};
        var y = [1, 2, 3];
        var z = function testfn(a) { return a + 1; };
        c.set(x, y);
        c.set(y, z);
        c.set(z, x);
        assert.equal(c.size, 3);
        c.delete(x);
        assert.equal(c.size, 2);
        assert.notInclude(Object.getOwnPropertyNames(x), key);
        c.delete(y);
        assert.equal(c.size, 1);
        assert.notInclude(Object.getOwnPropertyNames(y), key);
        c.delete(z);
        assert.equal(c.size, 0);
        assert.notInclude(Object.getOwnPropertyNames(z), key);
      });
      test('Clear collection', function() {
        var c = new PMap();
        var key = c.key;
        var x = {first: 'string'};
        c.set(x, 1);
        c.set(4, 1);
        c.clear();
        assert.notInclude(Object.getOwnPropertyNames(x), key);
        assert.equal(c.size, 0);
      });
      test('Multiple collections', function() {
        var c1 = new PMap();
        var c2 = new PMap();
        var key1 = c1.key;
        var key2 = c2.key;
        var x = {first: 'string'};
        c1.set(x, 11);
        c2.set(x, 21);
        c1.delete(x);
        assert.include(Object.getOwnPropertyNames(x), key2);
        assert.notInclude(Object.getOwnPropertyNames(x), key1);
        assert.notOk(c1.has(x));
        assert.ok(c2.has(x));
        c1.set(x, 12);
        c2.delete(x);
        assert.include(Object.getOwnPropertyNames(x), key1);
        assert.notInclude(Object.getOwnPropertyNames(x), key2);
        assert.notOk(c2.has(x));
        assert.ok(c1.has(x));
      });
    });
  });
});
