
import { run, compile } from "./compile";
import { highlightRegions } from "./syntax";

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
  run(data, mod, <boolean>program.transpile);
});
