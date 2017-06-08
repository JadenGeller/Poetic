import { section, PoemSection } from "./section";
import { tokenize, Token } from "./tokenize";
import { group, TokenTree } from "./group";
import { parse, LetIn, Statement, BuiltIn } from "./parse";

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

export function compile(text: string): Module {
    const tokens = Array.from(tokenize(text));
    const sections = Array.from(section(tokens[Symbol.iterator]()));

    let builtins: BuiltIn[] = [
        new BuiltIn("materialize", "let _materialize = n => console.log(n(x => x + 1)(0));"),
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
