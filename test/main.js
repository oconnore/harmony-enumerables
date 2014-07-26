if (typeof process === 'undefined') {
  mocha.setup('tdd');
  require(['./collections.js', './polyfill.js'], function() {
    mocha.checkLeaks();
    mocha.globals(['jQuery']);
    mocha.run();
  });
}
