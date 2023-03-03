function foo(x, y, z) {
  let a = (function () { return 3; })();
  let b = () => { return x * z; };
  console.log(a, b(), y);
}
foo(1, 'wut', 3);