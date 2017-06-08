import { section, PoemSection } from "./section";
import { tokenize, Token } from "./tokenize";
import { group, TokenTree } from "./group";
import {
    codegen,
    ExpectedLambdaBindingNameError, ExpectedLambdaBodyError,
    ExpectedPoemBindingNameError, ExpectedPoemBindingValueError
} from "./codegen";
import { parse, LetIn, Statement, BuiltIn } from "./parse";
import { GridText } from "./grid";
import { AssertionError } from "./utilities";

export class Module {
    constructor(
        // FIXME: This builtin system is extremely hacky and bad design!!
        public builtins: BuiltIn[],
        public tokens: Token[],
        public sections: PoemSection[], // TODO: Include other sections
        public globals: { [key: string]: LetIn | BuiltIn },
        public program: Statement | undefined
    ) { }
}

export function run(data: string, transpile: boolean) {
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

          if (transpile) {
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
}

export function compile(text: string): Module {
    const tokens = Array.from(tokenize(text));
    const sections = Array.from(section(tokens[Symbol.iterator]()));

    let builtins: BuiltIn[] = [
        new BuiltIn("materialize", "const _materialize = n => console.log(n(x => x + 1)(0));"),
    ];

    let globals: { [key: string]: LetIn | BuiltIn } = {};
    for (let b of builtins) {
        globals[b.name] = b;
    }
    let prevDecl: LetIn | undefined;
    let topDecl: LetIn | undefined;
    for (let sect of sections) {
        const nameToken = sect.headerToken.nameToken;
        const name = nameToken ? nameToken.toNormalized() : undefined;

        const expr = name ? parse(name, sect.bodyGroups, globals) : undefined;

        const decl = new LetIn(sect.headerToken, nameToken, expr);
        if (name) { globals[name] = decl; }

        if (prevDecl) { prevDecl.body = decl; }
        else { topDecl = decl; }
        prevDecl = decl;
    }

    return new Module(builtins, tokens, sections, globals, topDecl);
}
