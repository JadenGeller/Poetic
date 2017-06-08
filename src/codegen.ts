import { Statement, LetIn, Variable, Lambda, Application } from "./parse";
import { AssertionError } from "./utilities";

// TODO: Handle exports/imports!
function codegen(expr: Statement): string | null { // with lazy semantics!
    if (expr instanceof Lambda) {
        if (!expr.variableToken || !expr.body) { return null; }
        const body = codegen(expr.body);
        if (!body) { return null; }
        return "() => " + expr.variableToken.toNormalized() + " => " + body;
    } else if (expr instanceof Variable) {
        return expr.token.toNormalized();
    } else if (expr instanceof Application) {
        const func = codegen(expr.lambda);
        const arg = codegen(expr.argument);
        if (!func || !arg) { return null; }
        return `() => this._ ? this._ : this._ = (${func})()(${arg})`; // Memoized!
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
