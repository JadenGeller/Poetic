import { traverse, LetIn, Lambda, Variable, Application } from "./parse";
import { Module } from "./compile";
import { Interval } from "./utilities"

export enum HighlightType {
    Bold = 1,
    Underline = 2
}

export class Highlight {
    constructor(
        public region: Interval,
        public type: HighlightType)
    { }
}

// TODO: Consider imported functions
export function* highlightRegions(module: Module): IterableIterator<Highlight> {
    if (!module.program) { return };
    for (const expr of traverse(module.program)) {
        if (expr instanceof LetIn) {
            // no-op
        } else if (expr instanceof Lambda) {
            const startIndex = expr.keywordToken.startIndex();
            const endIndex = expr.variableToken ? expr.variableToken.endIndex() : expr.keywordToken.endIndex();
            yield new Highlight(new Interval(startIndex, endIndex), HighlightType.Underline);
        } else if (expr instanceof Variable) {
            yield new Highlight(expr.token.substring.interval, HighlightType.Bold);
        } else if (expr instanceof Application) {
            // no-op
        }
    }
}
