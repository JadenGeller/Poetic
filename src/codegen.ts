import { Statement, LetIn, Variable, Lambda, Application } from "./parse";
import { AssertionError } from "./utilities";

export class ExpectedLambdaBodyError {
    constructor(public lambda: Lambda) { }
}
export class ExpectedLambdaBindingNameError {
    constructor(public lambda: Lambda) { }
}
export class ExpectedPoemBindingNameError {
    constructor(public letIn: LetIn) { }
}
export class ExpectedPoemBindingValueError {
    constructor(public letIn: LetIn) { }
}
export type CompileError = ExpectedLambdaBodyError | ExpectedLambdaBindingNameError
    | ExpectedPoemBindingNameError | ExpectedPoemBindingValueError;

function escaped(text: string): string {
    return "_" + text.replace("'", "_");
}

// TODO: Return a list of errors on failure
export function codegen(expr: Statement, tightlyBound: boolean = false): string | CompileError[] {
    function maybeParen(text: string, shouldParen: boolean): string {
        return shouldParen ? `(${text})` : text;
    }

    if (expr instanceof Lambda) {
        const body = expr.body ? codegen(expr.body) : undefined;
        if (!expr.variableToken || !expr.body || typeof body == "object") {
            const errors: CompileError[] = [];
            if (!expr.variableToken) { errors.push(new ExpectedLambdaBindingNameError(expr)) }
            if (!expr.body)          { errors.push(new ExpectedLambdaBodyError(expr)); }
            if (body == "object")    { Array.prototype.push.apply(errors, body); }
            return errors;
        }
        return maybeParen(`${escaped(expr.variableToken.toNormalized())} => ${body}`, tightlyBound);
    } else if (expr instanceof Variable) {
        return escaped(expr.token.toNormalized());
    } else if (expr instanceof Application) {
        const func = codegen(expr.lambda, true);
        const arg = codegen(expr.argument);
        if (typeof func == "object" || typeof arg == "object") {
            const errors: CompileError[] = [];
            if (typeof func == "object") { Array.prototype.push.apply(errors, func); }
            if (typeof arg  == "object") { Array.prototype.push.apply(errors, arg); }
            return errors;
        }
        return `${func}(${arg})`;
    } else if (expr instanceof LetIn) {
        const varValue = expr.variableValue ? codegen(expr.variableValue) : undefined;
        const body = expr.body ? codegen(expr.body) : undefined;
        if (!expr.variableToken || !expr.variableValue ||
            typeof varValue == "object" || typeof body == "object") {
            const errors: CompileError[] = [];
            if (!expr.variableToken) { errors.push(new ExpectedPoemBindingNameError(expr)) }
            if (!expr.variableValue) { errors.push(new ExpectedPoemBindingValueError(expr)); }
            if (typeof varValue == "object") { Array.prototype.push.apply(errors, varValue); }
            if (typeof body     == "object") { Array.prototype.push.apply(errors, body); }
            return errors;
        }
        const decl = `const ${escaped(expr.variableToken.toNormalized())} = ${varValue};`;
        return body ? `${decl}\n${body}` : decl;
    } else {
        throw new AssertionError();
    }
}
