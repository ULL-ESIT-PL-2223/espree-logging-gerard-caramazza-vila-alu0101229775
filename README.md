[![Open in Codespaces](https://classroom.github.com/assets/launch-codespace-f4981d0f882b2a3f0472912d15f9806d57e124e0fc890972558857b51b24a6f9.svg)](https://classroom.github.com/open-in-codespaces?assignment_repo_id=10314182)

# [Práctica Espree logging](https://ull-esit-gradoii-pl.github.io//practicas/espree-logging)

- [Práctica Espree logging](#práctica-espree-logging)
- [Introducción](#introducción)
- [Resumen de lo aprendido](#resumen-de-lo-aprendido)
- [El ejecutable](#el-ejecutable)
- [El programa](#el-programa)
- [Indicar los valores de los argumentos](#indicar-los-valores-de-los-argumentos)
- [CLI con Commander.js](#cli-con-commanderjs)
- [Reto 1: Soportar funciones flecha](#reto-1-soportar-funciones-flecha)
- [Reto 2: Añadir el número de línea](#reto-2-añadir-el-número-de-línea)
- [Publicación como paquete npm](#publicación-como-paquete-npm)
- [Tests and Covering](#tests-and-covering)
- [Rúbrica](#rúbrica)

## Introducción
>[Volver al principio 🔝](#práctica-espree-logging)

En el repo encontrará el programa `logging-espree.js` el cual implementa una función addLogging que:
- cuando se llama analiza el código JS que se la da como entrada
- produciendo como salida un código JS equivalente que inserta mensajes de console.log a la entrada de cada función.

## Resumen de lo aprendido
>[Volver al principio 🔝](#práctica-espree-logging)

El programa genera un **arbol AST** a partir de un fichero de entrada con código y, una vez se tiene dicho arbol, se recorre para generar el código de nuevo pero modificado con los console.log() a través el `escodegen` y el `transpile`.

Asimismo, se ha aprendido a utilizar el `debugger` de Chrome para inspeccionar el programa.

## El ejecutable
>[Volver al principio 🔝](#práctica-espree-logging)

El ejecutable está en `bin/log.js` y se puede ejecutar con `npm start` o `node bin/log.js`.

Contenido de `bin/log.js`:
```javascript
#!/usr/bin/env node
import { program } from "commander";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { version } = require("../package.json");
import { transpile } from "../src/logging-espree.js";

program
  .version(version)
  .argument("<filename>", 'file with the original code')
  .option("-V, --version", "output the version number")
  .option("-o, --output <filename>", "file in which to write the output", "output.js")
  .option("-h, --help", "output usage information")
  .action((filename, options) => {
    transpile(filename, options.output);
  });

program.parse(process.argv);
```

## El programa
>[Volver al principio 🔝](#práctica-espree-logging)

El programa está en `src/logging-espree.js`: 
```javascript
import * as escodegen from "escodegen";
import * as espree from "espree";
import * as estraverse from "estraverse";
import * as fs from "fs/promises";

/**
 * Read the file with the js program, calls addLogin to add the login messages and writes the output
 * @param {string} input_file - The name of the input file
 * @param {string} output_file - The name of the output file (default: output.js)
 */
export async function transpile(inputFile, outputFile) {
  try {
    if (inputFile) {
      // console.log(`Transpiling '${inputFile}' to '${outputFile}'`);
      /* Al leer un fichero se usa una función asíncrona
      * Todas las funciones asíncronas llevan una callback que es el único
      * lugar donde estamos seguros que el código se va a ejecutar después
      * de haber ejecutado la función
      * Normalmente se pasa como argumento el error y resultado de la 
      * función asíncrona, para el caso de que no hubiera error.
      */
      let input = await fs.readFile(inputFile, 'utf8', (err) => {
        console.log(`Input read from file '${inputFile}'`);
        /// Si hay error se envía un throw
        if (err) throw `Error reading '${inputFile}': ${err}`;
      });
      /// Se llama al addLoggin y se guarda en output
      const output = addLogging(input);
      /// Se muesta la cadena de entrada al programador
      console.error(`input:\n${input}\n---`);
      /// Manera correcta de realizar el write después del read 
      /// (dentro de la callback). Tendencia hacia la diagonalidad
      await fs.writeFile(outputFile, output, err => {
        /// Se comprueba si ha habido o no error y se imprime la salida por pantalla
        if (err) throw `Can't write to '${outputFile}': ${err}`;
        console.log(`Output in file '${outputFile}'`);
      });
    }
    else program.help();  //< En caso de no usar la sintaxis correcta se imprime la ayuda
  }
  catch (e) {
    console.error(`Hubo errores: ${e}`);
  }
}

/**
 * Builds the AST and
 * Traverses it searching for function nodes and callas addBeforeNode to transform the AST
 * @param {string} code - The source code 
 * @returns -- The transformed AST 
 */
export function addLogging(code) {
  const ast = espree.parse(code, {ecmaVersion: espree.latestEcmaVersion, loc: true});  //< Builds the AST
  estraverse.traverse(ast, {                                                           //< Traverses the AST searching for function nodes
    enter: function(node, parent) {
      if (node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression') {                                     //< If the node is a function node, calls addBeforeNode
        addBeforeCode(node);                                                           //< to transform the AST
      }
    }
  });
  return escodegen.generate(ast);                                                      //< Generates the code from the AST
}

/**
 * AST transformation
 * @param {AST function type node} node - The function node to be transformed
 */
function addBeforeCode(node) {
  const name = node.id ? node.id.name : '<anonymous function>';                                                        //< Gets the name of the function
  const parameters = node.params.map(param => `\$\{ ${param.name} \}`);                                                //< Gets the parameters of the function
  const beforeCode = "console.log('Entering " + name + "(" + parameters + ") at line " + node.loc.start.line + "');";  //< Builds the code to be added
  const beforeNodes = espree.parse(beforeCode, { ecmaVersion: 6 }).body;                                               //< Builds the AST from the code to be added
  node.body.body = beforeNodes.concat(node.body.body);                                                                 //< Adds the code to the AST
}
```

## Indicar los valores de los argumentos

Se ha modificado el código de `logging-espree.js` para que el log también indique los valores de los argumentos que se pasaron a la función. 
Ejemplo:

```javascript
function foo(a, b) {
  var x = 'blah';
  var y = (function (z) {
    return z+3;
  })(2);
}
foo(1, 'wut', 3);
```

```javascript
function foo(a, b) {
    console.log(`Entering foo(${ a }, ${ b })`);
    var x = 'blah';
    var y = function (z) {
        console.log(`Entering <anonymous function>(${ z })`);
        return z + 3;
    }(2);
}
foo(1, 'wut', 3);
```

Para ello, se ha modificado la función `addBeforeCode` para que añada el código de log de los argumentos de la función. 
```javascript
/**
 * AST transformation
 * @param {AST function type node} node - The function node to be transformed
 */
function addBeforeCode(node) {
  const name = node.id ? node.id.name : '<anonymous function>';                                                        //< Gets the name of the function
  const parameters = node.params.map(param => `\$\{ ${param.name} \}`);                                                //< Gets the parameters of the function
  const beforeCode = "console.log('Entering " + name + "(" + parameters + ") at line " + node.loc.start.line + "');";  //< Builds the code to be added
  const beforeNodes = espree.parse(beforeCode, { ecmaVersion: 6 }).body;                                               //< Builds the AST from the code to be added
  node.body.body = beforeNodes.concat(node.body.body);                                                                 //< Adds the code to the AST
}
```

## CLI con [Commander.js](https://www.npmjs.com/package/commander)

Se hace un parsing de la línea de comandos mediante el módulo npm `commander.js`. 
Contenido de `bin/log.js`:
```javascript
#!/usr/bin/env node
import { program } from "commander";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { version } = require("../package.json");
import { transpile } from "../src/logging-espree.js";

program
  .version(version)
  .argument("<filename>", 'file with the original code')
  .option("-V, --version", "output the version number")
  .option("-o, --output <filename>", "file in which to write the output", "output.js")
  .option("-h, --help", "output usage information")
  .action((filename, options) => {
    transpile(filename, options.output);
  });

program.parse(process.argv);
```

## Reto 1: Soportar funciones flecha

Para soportar funciones flecha basta con añadir `node.type === 'ArrowFunctionExpression'` en el condicional `if` de la función `addLogging` en el fichero `logging-espree.js`:
```javascript
/**
 * Builds the AST and
 * Traverses it searching for function nodes and callas addBeforeNode to transform the AST
 * @param {string} code - The source code 
 * @returns -- The transformed AST 
 */
export function addLogging(code) {
  const ast = espree.parse(code);                                                      //< Builds the AST
  estraverse.traverse(ast, {                                                           //< Traverses the AST searching for function nodes
    enter: function(node, parent) {
      if (node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression') {                                     //< If the node is a function node, calls addBeforeNode
        addBeforeCode(node);                                                           //< to transform the AST
      }
    }
  });
  return escodegen.generate(ast);                                                      //< Generates the code from the AST
}
```

## Reto 2: Añadir el número de línea

Para añadir el número de línea en el logging hemos añadido `node.loc.start.line` al `console.log()` y `{ecmaVersion: espree.latestEcmaVersion, loc: true}` en el parser de `espree` en el fichero `logging-espree.js`:
```javascript
/**
 * AST transformation
 * @param {AST function type node} node - The function node to be transformed
 */
function addBeforeCode(node) {
  const name = node.id ? node.id.name : '<anonymous function>';                                                        //< Gets the name of the function
  const parameters = node.params.map(param => `\$\{ ${param.name} \}`);                                                //< Gets the parameters of the function
  const beforeCode = "console.log('Entering " + name + "(" + parameters + ") at line " + node.loc.start.line + "');";  //< Builds the code to be added
  const beforeNodes = espree.parse(beforeCode, { ecmaVersion: 6 }).body;                                               //< Builds the AST from the code to be added
  node.body.body = beforeNodes.concat(node.body.body);                                                                 //< Adds the code to the AST
}
```

```javascript
/**
 * Builds the AST and
 * Traverses it searching for function nodes and callas addBeforeNode to transform the AST
 * @param {string} code - The source code 
 * @returns -- The transformed AST 
 */
export function addLogging(code) {
  const ast = espree.parse(code, {ecmaVersion: espree.latestEcmaVersion, loc: true});  //< Builds the AST
  estraverse.traverse(ast, {                                                           //< Traverses the AST searching for function nodes
    enter: function(node, parent) {
      if (node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression') {                                     //< If the node is a function node, calls addBeforeNode
        addBeforeCode(node);                                                           //< to transform the AST
      }
    }
  });
  return escodegen.generate(ast);                                                      //< Generates the code from the AST
}
```

## Publicación como paquete npm
>[Volver al principio 🔝](#práctica-espree-logging)

Seguimos los pasos de la [documentación de npm](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages) para publicar nuestro paquete en `npmjs.com` también disponible en los [apuntes de la asignatura](https://ull-esit-gradoii-pl.github.io/temas/introduccion-a-javascript/creating-and-publishing-npm-module.html#create-a-user-in-the-npm-registry-with-npm-adduser).

Creeamos un usuario en `npmjs.com`:
```bash
npm adduser
```

Iniciamos sesión en `npmjs.com`:
```bash
npm login
npm whoami
```

Configuramos nuestro paquete:
```bash
npm set init.author.name "Gerard Antony Caramazza Vilá"
npm set init.author.email "alu0101229775@ull.edu.es"
npm set init.author.url "https://github.com/alu0101229775"
```

Cambiamos la visibilidad del repositorio a público:
![Visibilidad Repositorio](https://i.gyazo.com/0fd74625ba232f44057b8c48918e4f61.png)

A continuación ejecutamos el siguiente comando para publicar el paquete:
```bash
npm publish --access=public
```

## Tests and Covering
>[Volver al principio 🔝](#práctica-espree-logging)

Para ejecutar los test añadimos las siguientes lineas en nuestro fichero `package.json`:
```json
"scripts": {
    "test": "mocha test/test.mjs",
    "cov": "c8 npm test",
    "cov-doc": "c8 --reporter=html --reporter=text --report-dir docs/coverage mocha",
    "doc": "documentation build ./src/** -f html -o docs",
    "test1": "bin/log.js test/data/test1.js",
    "test2": "bin/log.js test/data/test2.js",
    "test3": "bin/log.js test/data/test3.js"
}
```

Modificamos el fichero `test.mjs` para que se ejecuten los tests:
```javascript
import { transpile } from "../src/logging-espree.js";
import assert from 'assert';
import * as fs from "fs/promises";
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
import Tst from './test-description.mjs';

const Test = Tst.map(t => ({
  input: __dirname + '/data/' + t.input,
  output: __dirname + '/data/' + t.output,
  correctLogged: __dirname + '/data/' + t.correctLogged,
  correctOut: __dirname + '/data/' + t.correctOut,
})
)

function removeSpaces(s) {
  return s.replace(/\s/g, '');
}

for (let i = 0; i < Test.length; i++) {
  it(`transpile(${Tst[i].input}, ${Tst[i].output})`, async () => {
    /// Compile the input and check the output program is what expected
    await transpile(Test[i].input, Test[i].output);
    let output = await fs.readFile(Test[i].output, 'utf-8')
    let correctLogged = await fs.readFile(Test[i].correctLogged, 'utf-8')
    assert.equal(removeSpaces(output), removeSpaces(correctLogged));
    await fs.unlink(Test[i].output);

    /// Run the output program and check the logged output is what expected
    let correctOut = await fs.readFile(Test[i].correctOut, 'utf-8')
    let oldLog = console.log; // mocking console.log
    let result = "";
    console.log = function (...s) { result += s.join('') }
      eval(output);
      assert.equal(removeSpaces(result), removeSpaces(correctOut))
    console.log = oldLog;
  }); 
}
```

Añadimos 3 tests más en la carpeta `test/data`:
Test 1:
```javascript
function foo(a) {
  console.log(a);
  let b = () => {
    console.log('pl');
  }
  b();
}
foo(() => console.log('hi'));
```

```bash
> @alu0101229775/espree-logging@0.3.0 cov-doc
> c8 --reporter=html --reporter=text --report-dir docs/coverage mocha



input:
function foo(a, b) {   
    var x = 'blah';   
    var y = (function () {
      return 3;
    })();
  }     
foo(1, 'wut', 3);
---
  ✔ transpile(test1.js, logged1.js)
input:
function foo(a, b) {
    var x = 'blah';
    var y = (function (z) {
      return z+3;
    })(2);
  }
foo(1, 'wut', 3);
  
---
  ✔ transpile(test2.js, logged2.js)
input:
function foo(a, b, c) {
    let x = 'tutu';
    let y = (function (x) { return x*x })(2);
    let z = (e => { return e +1 })(4);
    console.log(x,y,z);
  }
foo(1, 'wut', 3);
---
  ✔ transpile(test3.js, logged3.js)
input:
function foo(a) {
  console.log(a);
  let b = () => {
    console.log('pl');
  }
  b();
}
foo(() => console.log('hi'));
---
  ✔ transpile(test4.js, logged4.js)
input:
function foo(x, y, z) {
  let a = (function () { return 3; })();
  let b = () => { return x * z; };
  console.log(a, b(), y);
}
foo(1, 'wut', 3);
---
  ✔ transpile(test5.js, logged5.js)
input:
function foo(a, b, c) {
  let x = 'tutu';
  let y = (function (x) { return x*x })(2);
  let z = (e => { return e +1 })(4);
  console.log(x,y,z);
}
foo(1, 'wut', 3);
---
  ✔ transpile(test6.js, logged6.js)

  6 passing (69ms)

-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   93.04 |    84.61 |     100 |   93.04 |                   
 logging-espree.js |   93.04 |    84.61 |     100 |   93.04 | 38-40,49-51,57-58 
-------------------|---------|----------|---------|---------|-------------------
```

# Rúbrica
>[Volver al principio 🔝](#práctica-espree-logging)

- [x] Opciones en línea de comandos (-o, -V, -h, etc.)
- [x] Añade mensajes de logs a la entrada de las function()
- [x] Añade mensajes de logs a la entrada de las arrow () => { ... }
- [x] Tutorial README.md y paneles bien presentados
- [x] Da información correcta de los números de línea
- [x] El package.json tiene scripts para ejecutar el programa
- [x] El paquete está publicado en npmjs con ámbito aluXXX
- [x] Contiene un ejecutable que se ejecuta correctamente (--help, etc.)
- [x] El módulo exporta las funciones adecuadas
- [x] Contiene suficientes tests
- [x] Estudio de covering
- [x] Se ha hecho CI con GitHub Actions
- [x] La documentación es completa: API, ejecutable, instalación, etc.
- [x] Se ha probado que la librería está accesible y funciona
- [x] Se ha probado que el ejecutable queda correctamente instalado, puede ser ejecutado con el nombre publicado y produce salidas correctas
- [x] Se ha hecho un buen uso del versionado semántico en la evolución del módulo