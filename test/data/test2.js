function foo(a, b) {
    var x = 'blah';
    var y = (function (z) {
      return z+3;
    })(2);
  }
foo(1, 'wut', 3);
  