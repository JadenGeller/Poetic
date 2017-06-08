import { TokenGroup, TokenTree } from "./group";
import { Token, WordToken, OpenerToken, CloserToken, HeaderToken } from "./tokenize";
import { PeekableIterator } from "./utilities";

interface Binder {
    variableToken: WordToken;
}

export class Variable {
    constructor(
        public binder: Partial<Binder>,
        public token: WordToken
    ) { }

    public toString = (): string => {
        if (this.binder.variableToken) {
            return this.binder.variableToken.toNormalized();
        } else {
            return "_";
        }
    }
}

export class Lambda implements Partial<Binder> {
    constructor(
        public keywordToken: WordToken,
        public variableToken?: WordToken
    ) { }
    public body?: Expression;

    public toString = (): string => {
        const name = this.variableToken ? this.variableToken.toNormalized() : "_";
        const body = this.body ? this.body.toString() : "_";
        return `λ${name}.${body}`;
    }
}

export class Application {
    constructor(
        public lambda: Expression,
        public argument: Expression
    ) { }

    public toString = (): string => {
        return `(${this.lambda.toString()}) (${this.argument.toString()})`;
    }
}

export class LetIn implements Partial<Binder> {
    constructor(
        public headerToken: HeaderToken,
        public variableToken?: WordToken,
        public variableValue?: Expression,
        public body?: Expression | LetIn
    ) { }

    public toStringExcludingBody(): string {
        const name = this.variableToken ? this.variableToken.toNormalized() : "_";
        const value = this.variableValue ? this.variableValue.toString() : "_";
        return `let ${name} = ${value};`;
    }

    public toString = (): string => {
        return `${this.toStringExcludingBody()}\n` + (this.body ? this.body.toString() : "_");
    }
}

export type Expression = Variable | Lambda | Application;
export type Statement = Expression | LetIn;

class Scope {
    private base: { [key: string]: Binder[] } = {};

    push(binder: Binder) {
        const name = binder.variableToken.toNormalized();
        if (!(name in this.base)) {
            this.base[name] = []
        }
        this.base[name].unshift(binder)
    }
    pop(binder: Binder) {
        const name = binder.variableToken.toNormalized();
        if (name in this.base) {
            this.base[name].shift()
            if (this.base[name].length == 0) {
                delete this.base[name];
            }
        }
    }
    lookup(name: string): Binder | null {
        if (name in this.base) {
            return this.base[name][0]
        } else {
            return null
        }
    }
}

export function parse(
    keyword: string,
    groups: TokenTree[],
    globals: { [key: string]: LetIn } = {}
): Expression | undefined {
    let scope = new Scope();

    function parseGroups(tokens: TokenTree[]): Expression | undefined {
        let result: Expression | undefined;
        function append(expr: Expression): Expression {
            if (!result) {
                result = expr;
            } else {
                result = new Application(result, expr);
            }
            return result;
        }

        let tokenIter = new PeekableIterator(tokens[Symbol.iterator]());
        for (let token of tokenIter) {
            if (token instanceof TokenGroup) {
                const group = parseGroups(token.groupedTokens);
                // Ignore empty groups
                if (group) {
                    append(group);
                }
            } else if (token instanceof Token) {
                if (token.toNormalized() == keyword) {
                    // Determine binding name
                    let { value: nextToken, done } = tokenIter.peek();
                    let variableToken: WordToken | undefined;
                    if (!done && nextToken instanceof WordToken) {
                        variableToken = nextToken;
                        tokenIter.next();
                    }

                    // Parse body with binding in scope
                    const lambda = new Lambda(token, variableToken)
                    if (lambda.variableToken) { scope.push(<Binder>lambda); }
                    const body = parseGroups(Array.from(tokenIter));
                    if (lambda.variableToken) { scope.pop(<Binder>lambda); }
                    lambda.body = body;
                    // Return lambda node
                    return append(lambda);
                }
                else {
                    const local = scope.lookup(token.toNormalized());
                    if (local) {
                        append(new Variable(local, token));
                    } else if (token.toNormalized() in globals) { // FIXME: Lowercasing is gross here.
                        append(new Variable(globals[token.toNormalized()], token));
                    }
                }
            }
        }
        return result;
    }
    return parseGroups(groups);
}

export function* traverse(expr: Statement): IterableIterator<Statement> {
    yield expr;
    if (expr instanceof Lambda) {
        if (expr.body) { yield* traverse(expr.body); }
    } else if (expr instanceof Variable) {
        // no-op
    } else if (expr instanceof Application) {
        yield* traverse(expr.lambda);
        yield* traverse(expr.argument);
    } else if (expr instanceof LetIn) {
        if (expr.variableValue) { yield* traverse(expr.variableValue); }
        if (expr.body) { yield* traverse(expr.body); }
    }
}
