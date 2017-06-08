import { Statement, LetIn, Variable, Lambda, Application } from "./parse";
import { AssertionError } from "./utilities";

function maybeParen(text: string, shouldParen: boolean): string {
    return shouldParen ? `(${text})` : text;
}

export function codegen(expr: Statement, tightlyBound: boolean = false): string | null {
    if (expr instanceof Lambda) {
        if (!expr.variableToken || !expr.body) { return null; }
        const body = codegen(expr.body);
        if (!body) { return null; }
        return maybeParen(`${expr.variableToken.toNormalized()} => ${body}`, tightlyBound);
    } else if (expr instanceof Variable) {
        return expr.token.toNormalized();
    } else if (expr instanceof Application) {
        const func = codegen(expr.lambda, true);
        const arg = codegen(expr.argument);
        if (!func || !arg) { return null; }
        return `${func}(${arg})`;
    } else if (expr instanceof LetIn) {
        if (!expr.variableToken || !expr.variableValue) { return null; }
        const varValue = codegen(expr.variableValue);
        if (!varValue) { return null; }
        const decl = `const ${expr.variableToken.toNormalized()} = ${varValue};`;
        if (expr.body) {
            const body = codegen(expr.body);
            if (!body) { return null; }
            return decl + "\n" + body;
        } else {
            return decl;
        }
    } else {
        throw new AssertionError();
    }
}
