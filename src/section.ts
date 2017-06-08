import { Substring, Interval, PeekableIterator } from "./utilities";
import {
    tokenize,
    Token, SyntaxToken, GrouperToken,
    HeaderToken, WordToken, OpenerToken, CloserToken, NewLineToken
} from "./tokenize";

export class TitleSection {
    constructor(
        public title: Substring,
        public author: Substring,
        public publisher: Substring,
        public year: Substring,
    ) { }
}

export class PoemSection {
    constructor(
        public headerToken: HeaderToken,
        public bodyTokens: (WordToken | GrouperToken)[]
    ) { }
}

export class WorksCitedSection {
    // TODO
}

function skipNewLines(tokens: PeekableIterator<SyntaxToken>): boolean {
    let didSkip = false;
    while (!tokens.peek().done && (tokens.peek().value instanceof NewLineToken)) {
        didSkip = true;
        tokens.next();
    }
    return didSkip;
}

function parsePoemSection(tokens: PeekableIterator<SyntaxToken>): PoemSection | null {
    let { value: headerToken, done } = tokens.peek();
    if (done) { return null; }
    if (!(headerToken instanceof HeaderToken)) { return null; }
    tokens.next();

    if (!skipNewLines(tokens)) {
        // TODO: Emit warning!
    }

    let bodyTokens: (WordToken | GrouperToken)[] = []
    while (!tokens.peek().done && !(tokens.peek().value instanceof HeaderToken)) {
        const token = tokens.next().value;
        if (!(token instanceof NewLineToken)) {
            bodyTokens.push(token);
        }
    }

    return new PoemSection(headerToken, bodyTokens)
}

export type ClosedSection = PoemSection
export function* section(_tokens: Iterator<SyntaxToken>): IterableIterator<ClosedSection> {
    const tokens = new PeekableIterator(_tokens);

    // TODO: Parse title

    while (true) {
        skipNewLines(tokens);
        const result = parsePoemSection(tokens);
        if (result) { yield result; }
        else { break; }
    }

    // TODO: Parse works cited section
}
