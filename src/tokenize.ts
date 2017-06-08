import { Substring, Interval, assert } from "./utilities";

export abstract class Token {
    constructor(public substring: Substring) { }

    startIndex(): number { return this.substring.startIndex(); }
    endIndex(): number { return this.substring.endIndex(); }

    public toString = (): string => {
        return this.substring.toString();
    }
}

export class HeaderToken extends Token {
    constructor(substring: Substring,
                public innerText: Substring,
                public nameToken: WordToken | undefined,
                public isClosed: boolean) {
        super(substring)
    }
}

export class WordToken extends Token {
    toNormalized(): string {
        return this.toString().toLowerCase().replace("'", "_");
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
            assert(wordStart == -1);

            let nameToken: WordToken | undefined;
            const headerStart = index;
            index += 1;
            for (let char of charIter) {
                if (!nameToken && wordStart == -1 && char.match(startWord)) {
                    wordStart = index;
                } else if (wordStart > -1 && char.match(endWord)) {
                    nameToken =  new WordToken(new Substring(text, new Interval(wordStart, index)));
                    wordStart = -1;
                }

                if (char.match(headerDelimiter) || char == '\n') {
                    yield new HeaderToken(
                        new Substring(text, new Interval(headerStart, index + 1)),
                        new Substring(text, new Interval(headerStart + 1, index)),
                        nameToken,
                        char.match(headerDelimiter) != null
                    );
                    break;
                }
                index += 1;
            }
        }
        index += 1;
    }
}
