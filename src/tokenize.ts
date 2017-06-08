import { Substring, Interval } from "./utilities";

export abstract class Token {
    constructor(private _substring: Substring) { }

    startIndex(): number { return this._substring.startIndex(); }
    endIndex(): number { return this._substring.endIndex(); }

    public toString = (): string => {
        return this._substring.toString();
    }
}

export class HeaderToken extends Token {
    constructor(_contents: Substring,
                private _innerText: Substring,
                private _isClosed: boolean) {
        super(_contents)
    }
    innerText(): Substring { return this._innerText; }

    // TODO: Make sure that the client warns when this is not true?
    isClosed(): boolean { return this._isClosed; }
}

export class WordToken extends Token {
    toNormalized(): string {
        return this.toString().toLowerCase();
    }
}
export class OpenerToken extends Token { }
export class CloserToken extends Token { }
export class NewLineToken extends Token { }

export type GrouperToken = OpenerToken | CloserToken;
export type SyntaxToken = WordToken | GrouperToken | HeaderToken | NewLineToken;

const startWord = /[a-z']/i;
const endWord = /[^a-z']/i;
const groupOpener = /,/;
const groupCloser = /\./;
const headerDelimiter = /"|“|”|\*/;

export function* tokenize(text: string): IterableIterator<SyntaxToken> {
    let charIter = text[Symbol.iterator]();

    let index = 0;
    let wordStart = -1;
    for (let char of charIter) {
        if (wordStart == -1 && char.match(startWord)) {
            wordStart = index;
        } else if (wordStart > -1 && char.match(endWord)) {
            yield new WordToken(new Substring(text, new Interval(wordStart, index)));
            wordStart = -1;
        }

        if (char == '\n') {
            yield new NewLineToken(new Substring(text, new Interval(index, index + 1)));
        } else if (char == ',') {
            yield new OpenerToken(new Substring(text, new Interval(index, index + 1)));
        } else if (char == '.') {
            yield new CloserToken(new Substring(text, new Interval(index, index + 1)));
        } else if (char.match(headerDelimiter)) {
            const startIndex = index;
            index += 1;
            for (let char of charIter) {
                if (char.match(headerDelimiter) || char == '\n') {
                    yield new HeaderToken(
                        /* contents  */ new Substring(text, new Interval(startIndex, index + 1)),
                        /* innerText */ new Substring(text, new Interval(startIndex + 1, index)),
                        /* isClosed  */ char.match(headerDelimiter) != null
                    );
                    break;
                }
                index += 1;
            }
        }
        index += 1;
    }
}
