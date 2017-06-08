import { section, PoemSection } from "./section";
import { tokenize, Token } from "./tokenize";
import { group, TokenTree } from "./group";
import { parse, LetIn, Statement } from "./parse";

export class Module {
    constructor(
        public tokens: Token[],
        public sections: PoemSection[], // TODO: Include other sections
        public globals: { [key: string]: LetIn },
        public program: Statement | undefined
    ) { }
}

export function compile(text: string): Module {
    const tokens = Array.from(tokenize(text));
    const sections = Array.from(section(tokens[Symbol.iterator]()));

    let globals: { [key: string]: LetIn } = {};
    let prevDecl: LetIn | undefined;
    let topDecl: LetIn | undefined;
    for (let sect of sections) {
        const nameToken = sect.headerToken.nameToken;
        const name = nameToken ? nameToken.toNormalized() : undefined;

        const expr = name ? parse(name, sect.bodyGroups, globals) : undefined;

        const decl = new LetIn(nameToken, expr);
        if (name) { globals[name] = decl; }

        if (prevDecl) { prevDecl.body = decl; }
        else { topDecl = decl; }
        prevDecl = decl;
    }

    return new Module(tokens, sections, globals, topDecl);
}
