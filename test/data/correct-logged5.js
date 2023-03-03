function foo(x, y, z) {
  console.log(`Entering foo(${ x }, ${ y }, ${ z }) at line 1`);
  let a = function () {
      console.log(`Entering <anonymous function>() at line 2`);
      return 3;
  }();
  let b = () => {
      console.log(`Entering <anonymous function>() at line 3`);
      return x * z;
  };
  console.log(a, b(), y);
}
foo(1, 'wut', 3);