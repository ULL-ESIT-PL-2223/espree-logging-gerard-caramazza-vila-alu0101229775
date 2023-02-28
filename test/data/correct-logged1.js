function foo(a, b) {
    console.log(`Entering foo(${ a }, ${ b }) at line 1`);
    var x = 'blah';
    var y = function () {
        console.log(`Entering <anonymous function>() at line 3`);
        return 3;
    }();
}
foo(1, 'wut', 3);