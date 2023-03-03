function foo(a) {
  console.log(`Entering foo(${ a }) at line 1`);
  console.log(a);
  let b = () => {
      console.log(`Entering <anonymous function>() at line 3`);
      console.log('pl');
  };
  b();
}
foo(() => console.log('hi'));