/**
 * Universidad de La Laguna
 * Escuela Superior de Ingeniería y Tecnología
 * Grado en Ingeniería Informática
 * Procesadores de Lenguajes 2022-2023
 *
 * @author Gerard Antony Caramazza Vilá
 * @email alu0101229775@ull.edu.es
 * @since Feb 28 2023
 * @desc espree-logging. Fases de un compilador
 * @see {@link https://ull-esit-gradoii-pl.github.io//practicas/esprima-logging}
 * @see {@link https://youtu.be/UqTlToUYK1E}
 * @see {@link https://www.npmjs.com/package/commander#version-option}
 */

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
  const beforeCode = "console.log(`Entering " + name + "(" + parameters + ") at line " + node.loc.start.line + "`);";  //< Builds the code to be added
  const beforeNodes = espree.parse(beforeCode, { ecmaVersion: 6 }).body;                                               //< Builds the AST from the code to be added
  node.body.body = beforeNodes.concat(node.body.body);                                                                 //< Adds the code to the AST
}

/*
console.log(addLogging(`
function foo(a, b) {   
  var x = 'blah';   
  var y = (function (z) {
    return 3;
  })();
}
foo(1, 'wut', 3);
`));
*/

/*
console.log(addLogging(`
function foo(a, b, c) {
  let x = 'tutu';
  let y = (function (x) { return x*x })(2);
  let z = (e => { return e +1 })(4);
  console.log(x,y,z);
}
foo(1, 'wut', 3);
`));
*/