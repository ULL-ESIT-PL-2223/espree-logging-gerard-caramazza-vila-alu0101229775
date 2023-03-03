function foo(a) {
  console.log(a);
  let b = () => {
    console.log('pl');
  }
  b();
}
foo(() => console.log('hi'));