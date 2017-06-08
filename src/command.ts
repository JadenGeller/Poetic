import {
    codegen,
    ExpectedLambdaBindingNameError, ExpectedLambdaBodyError,
    ExpectedPoemBindingNameError, ExpectedPoemBindingValueError
} from "./codegen";
import { compile } from "./compile";
import { highlightRegions } from "./syntax";
import { GridText } from "./grid";
import { AssertionError } from "./utilities";

import program = require('commander');
import fs = require('fs');

program
    .version('0.0.1')
    .usage('<file>')
    .option('-t, --transpile', 'Transpile instead of running')
    .parse(process.argv);

// TODO: Other args?
fs.readFile(program.args[0], 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  const mod = compile(data);
//   console.log(mod.program ? mod.program.toString() : "")
  if (mod.program) {
      const result = codegen(mod.program);
      if (typeof result == "string") {
          let fullResult = "// Builtins\n";
          for (let b of mod.builtins) {
              fullResult += b.impl;
          }
          fullResult += "\n\n// Program\n"
          fullResult += result;

          if (program.transpile) {
              console.log(fullResult);
          } else {
              eval(fullResult);
          }
      } else {
          for (let error of result) {
              const doc = new GridText(data);

              if (error instanceof ExpectedLambdaBindingNameError) {
                  const [line, col] = doc.linecol(error.lambda.keywordToken.startIndex());
                  console.log(`(${line}, ${col}): error: expected lambda binding name after "${error.lambda.keywordToken.toString()}"`);
                  console.log(` -> ${error.lambda.toString()}`);
              } else if (error instanceof ExpectedLambdaBodyError) {
                  const [line, col] = doc.linecol(error.lambda.keywordToken.startIndex());
                  if (error.lambda.variableToken) {
                      console.log(`(${line}, ${col}): error: expected lambda body after binder "${error.lambda.variableToken.toString()}"`);
                  } else {
                      console.log(`(${line}, ${col}): error: expected lambda body`);
                  }
                  console.log(` -> ${error.lambda.toString()}`);
              } else if (error instanceof ExpectedPoemBindingNameError) {
                  const [line, col] = doc.linecol(error.letIn.headerToken.innerText.startIndex());
                  console.log(`(${line}, ${col}): error: expected poem name`);
                  console.log(` -> ${error.letIn.toStringExcludingBody()}`);
              } else if (error instanceof ExpectedPoemBindingValueError) {
                  const [line, col] = doc.linecol(error.letIn.headerToken.innerText.startIndex());
                  console.log(`(${line}, ${col}): error: expected poem body for "${error.letIn.headerToken.innerText.toString()}"`);
                  console.log(` -> ${error.letIn.toStringExcludingBody()}`);
              } else {
                  throw new AssertionError();
              }
          }
          console.log("\nin program...\n")
          console.log(mod.program.toString());
      }
  } else {
      console.log("NO PROGRAM")
  }
});
