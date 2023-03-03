#!/usr/bin/env node

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
