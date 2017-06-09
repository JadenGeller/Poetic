(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parse_1 = require("./parse");
const utilities_1 = require("./utilities");
class ExpectedLambdaBodyError {
    constructor(lambda) {
        this.lambda = lambda;
    }
}
exports.ExpectedLambdaBodyError = ExpectedLambdaBodyError;
class ExpectedLambdaBindingNameError {
    constructor(lambda) {
        this.lambda = lambda;
    }
}
exports.ExpectedLambdaBindingNameError = ExpectedLambdaBindingNameError;
class ExpectedPoemBindingNameError {
    constructor(letIn) {
        this.letIn = letIn;
    }
}
exports.ExpectedPoemBindingNameError = ExpectedPoemBindingNameError;
class ExpectedPoemBindingValueError {
    constructor(letIn) {
        this.letIn = letIn;
    }
}
exports.ExpectedPoemBindingValueError = ExpectedPoemBindingValueError;
function escaped(text) {
    return "_" + text.replace("'", "_");
}
// TODO: Return a list of errors on failure
function codegen(expr, tightlyBound = false) {
    function maybeParen(text, shouldParen) {
        return shouldParen ? `(${text})` : text;
    }
    if (expr instanceof parse_1.Lambda) {
        const body = expr.body ? codegen(expr.body) : undefined;
        if (!expr.variableToken || !expr.body || typeof body == "object") {
            const errors = [];
            if (!expr.variableToken) {
                errors.push(new ExpectedLambdaBindingNameError(expr));
            }
            if (!expr.body) {
                errors.push(new ExpectedLambdaBodyError(expr));
            }
            if (typeof body == "object") {
                Array.prototype.push.apply(errors, body);
            }
            return errors;
        }
        return maybeParen(`${escaped(expr.variableToken.toNormalized())} => ${body}`, tightlyBound);
    }
    else if (expr instanceof parse_1.Variable) {
        return escaped(expr.token.toNormalized());
    }
    else if (expr instanceof parse_1.Application) {
        const func = codegen(expr.lambda, true);
        const arg = codegen(expr.argument);
        if (typeof func == "object" || typeof arg == "object") {
            const errors = [];
            if (typeof func == "object") {
                Array.prototype.push.apply(errors, func);
            }
            if (typeof arg == "object") {
                Array.prototype.push.apply(errors, arg);
            }
            return errors;
        }
        return `${func}(${arg})`;
    }
    else if (expr instanceof parse_1.LetIn) {
        const varValue = expr.variableValue ? codegen(expr.variableValue) : undefined;
        const body = expr.body ? codegen(expr.body) : undefined;
        if (!expr.variableToken || !expr.variableValue ||
            typeof varValue == "object" || typeof body == "object") {
            const errors = [];
            if (!expr.variableToken) {
                errors.push(new ExpectedPoemBindingNameError(expr));
            }
            if (!expr.variableValue) {
                errors.push(new ExpectedPoemBindingValueError(expr));
            }
            if (typeof varValue == "object") {
                Array.prototype.push.apply(errors, varValue);
            }
            if (typeof body == "object") {
                Array.prototype.push.apply(errors, body);
            }
            return errors;
        }
        const decl = `const ${escaped(expr.variableToken.toNormalized())} = ${varValue};`;
        return body ? `${decl}\n${body}` : decl;
    }
    else {
        throw new utilities_1.AssertionError();
    }
}
exports.codegen = codegen;

},{"./parse":6,"./utilities":10}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const section_1 = require("./section");
const tokenize_1 = require("./tokenize");
const codegen_1 = require("./codegen");
const parse_1 = require("./parse");
const grid_1 = require("./grid");
const utilities_1 = require("./utilities");
class Module {
    constructor(
        // FIXME: This builtin system is extremely hacky and bad design!!
        builtins, tokens, sections, // TODO: Include other sections
        globals, program) {
        this.builtins = builtins;
        this.tokens = tokens;
        this.sections = sections;
        this.globals = globals;
        this.program = program;
    }
}
exports.Module = Module;
function run(data, mod, transpile) {
    //   console.log(mod.program ? mod.program.toString() : "")
    if (mod.program) {
        const result = codegen_1.codegen(mod.program);
        if (typeof result == "string") {
            let fullResult = "// Builtins\n";
            for (let b of mod.builtins) {
                fullResult += b.impl;
            }
            fullResult += "\n\n// Program\n";
            fullResult += result;
            if (transpile) {
                console.log(fullResult);
            }
            else {
                eval(fullResult);
            }
        }
        else {
            for (let error of result) {
                const doc = new grid_1.GridText(data);
                if (error instanceof codegen_1.ExpectedLambdaBindingNameError) {
                    const [line, col] = doc.linecol(error.lambda.keywordToken.startIndex());
                    console.log(`(${line}, ${col}): error: expected lambda binding name after "${error.lambda.keywordToken.toString()}"`);
                    console.log(` -> ${error.lambda.toString()}`);
                }
                else if (error instanceof codegen_1.ExpectedLambdaBodyError) {
                    const [line, col] = doc.linecol(error.lambda.keywordToken.startIndex());
                    if (error.lambda.variableToken) {
                        console.log(`(${line}, ${col}): error: expected lambda body after binder "${error.lambda.variableToken.toString()}"`);
                    }
                    else {
                        console.log(`(${line}, ${col}): error: expected lambda body`);
                    }
                    console.log(` -> ${error.lambda.toString()}`);
                }
                else if (error instanceof codegen_1.ExpectedPoemBindingNameError) {
                    const [line, col] = doc.linecol(error.letIn.headerToken.innerText.startIndex());
                    console.log(`(${line}, ${col}): error: expected poem name`);
                    console.log(` -> ${error.letIn.toStringExcludingBody()}`);
                }
                else if (error instanceof codegen_1.ExpectedPoemBindingValueError) {
                    const [line, col] = doc.linecol(error.letIn.headerToken.innerText.startIndex());
                    console.log(`(${line}, ${col}): error: expected poem body for "${error.letIn.headerToken.innerText.toString()}"`);
                    console.log(` -> ${error.letIn.toStringExcludingBody()}`);
                }
                else {
                    throw new utilities_1.AssertionError();
                }
            }
            console.log("\nin program...\n");
            console.log(mod.program.toString());
        }
    }
    else {
        console.log("NO PROGRAM");
    }
}
exports.run = run;
function compile(text) {
    const tokens = Array.from(tokenize_1.tokenize(text));
    const sections = Array.from(section_1.section(tokens[Symbol.iterator]()));
    let builtins = [
        new parse_1.BuiltIn("materialize", "const _materialize = n => console.log(n(x => x + 1)(0));"),
    ];
    let globals = {};
    for (let b of builtins) {
        globals[b.name] = b;
    }
    let prevDecl;
    let topDecl;
    for (let sect of sections) {
        const nameToken = sect.headerToken.nameToken;
        const name = nameToken ? nameToken.toNormalized() : undefined;
        const expr = name ? parse_1.parse(name, sect.bodyGroups, globals) : undefined;
        const decl = new parse_1.LetIn(sect.headerToken, nameToken, expr);
        if (name) {
            globals[name] = decl;
        }
        if (prevDecl) {
            prevDecl.body = decl;
        }
        else {
            topDecl = decl;
        }
        prevDecl = decl;
    }
    return new Module(builtins, tokens, sections, globals, topDecl);
}
exports.compile = compile;

},{"./codegen":1,"./grid":4,"./parse":6,"./section":7,"./tokenize":9,"./utilities":10}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const syntax_1 = require("./syntax");
const compile_1 = require("./compile");
// Due to inconsistencies in how browsers handle contenteditable divs, this
// code is only confirmed to work in Firefox.
class AttributedTextBox {
    constructor(div, initialInput) {
        this.div = div;
        div.contentEditable = "true";
        div.addEventListener("input", () => this.performSyntaxHighlighting());
        this.currentTagCharCount = 0;
        this.internalHTMLState = initialInput;
        this.commit();
        this.performSyntaxHighlighting();
    }
    commit() {
        this.div.innerHTML = this.internalHTMLState;
    }
    reset() {
        this.div.innerText = this.div.innerText;
    }
    getInnerText() {
        return this.div.innerText;
    }
    makeRangeTagged(startIndex, endIndex, openTag, closeTag) {
        startIndex += this.currentTagCharCount;
        endIndex += this.currentTagCharCount;
        let oldHTML = this.internalHTMLState;
        let newHTML = oldHTML.slice(0, startIndex) + openTag + oldHTML.slice(startIndex, endIndex) + closeTag + oldHTML.slice(endIndex);
        this.internalHTMLState = newHTML;
        this.currentTagCharCount += (openTag.length + closeTag.length);
    }
    boldRange(startIndex, endIndex) {
        this.makeRangeTagged(startIndex, endIndex, "<b>", "</b>");
    }
    underlineRange(startIndex, endIndex) {
        this.makeRangeTagged(startIndex, endIndex, "<ins>", "</ins>");
    }
    italicizeRange(startIndex, endIndex) {
        this.makeRangeTagged(startIndex, endIndex, "<i>", "</i>");
    }
    markRange(startIndex, endIndex) {
        this.makeRangeTagged(startIndex, endIndex, "<mark>", "</mark>");
    }
    performSyntaxHighlighting() {
        //TODO: save and restore cursor location
        this.div.blur();
        this.currentTagCharCount = 0;
        this.internalHTMLState = this.div.innerText;
        this.compiled = compile_1.compile(this.div.innerText);
        let text_iterator = syntax_1.highlightRegions(this.compiled);
        for (let c of text_iterator) {
            if (c.type == syntax_1.HighlightType.Bold) {
                this.boldRange(c.region.startIndex(), c.region.endIndex());
            }
            else {
                this.underlineRange(c.region.startIndex(), c.region.endIndex());
            }
        }
        this.commit();
    }
}
let poem1 = `"True friend"
It's not often true that
I can stand you,
But it's not often true to say
That I can live without you.

"False hope"
She has heard many false things
Has had many empty promises uttered
into her delicate ears;
But these false hopes of hers
They come from within-
For despite these dark shadows,
She is a treasure chest
 of childish hopes.

"Intersecting"
In life
You develop these
peculiar
intersecting paths,
crossed lines
constantly intersecting
people
and their paths
But how many of these people
and their paths
Do you stop to consider?


"Union"
His union
Her union
Their unions,
The same between them but with such different weight!
For her it is worth a thousand years' labor
a million gold coins
a lifetime of her dedication;
For him it is worth pocket change and a rumpled, unused wedding gown;
The weight of their disjoint love pressing creases into the fabric
like the deep furrows in the girl’s heart-shattered brow.

"Nothing is Lost"
Nothing gained,
Nothing lost –
until all is lost.

"One and Only"
I saw one girl, just
one light there in the café–
And I loved her!
Little did I know that
That girl would have her light
extinguished.

"After all this time"
After many suns have risen
After night has fallen from countless days
After time has blurred in a river of liquid memory–
Night is all that remains;
Despite our efforts,
the many reflections of faces and laughter and
color
fade into the black night
lost
to time.

"Before the day breaks"
Before day breaks
Before dawn comes
Before gulls shriek their lonely cries,
The dockmaster begins his day.
Long, long before ships start their journey
Before sailors brave the merciless tide
He rises in the dark;
Envious of the sailors, longing to be
On those ships
Chasing the dawn
On the cusp of adventure.
But he knows-
Knows that this is not his call
And that he is bound here
Upon his wooden shore.
Else, who would rise before them,
to wave the gulls on their maritime perches
to greet the sun
to sweep and batten and tighten and prepare?
Certainly no other.
It was his task alone.
How, with all that he does and
all that must be done as he rises before them,
ready to see them set out to chase the sun?
How could he ask another to take his post?
He is the watchman.
He is the crewman
Who protects the journey
The waves
The sun
The sea.
Taking his post,
he stares into the blistering wind
And smiles.

"Add some"
Bring water to a boil and add two troubled people
Once done stirring, add some sharp words
Wait for two minutes, or a lifetime if preferred:
The exact amount of time won't matter
after the stewing is done.
Then toss in some hot tears and bitter frowns.
This is the recipe for a 'complicated relationship'.

"Difference"
Man has an alarming skill for noticing difference between two things-
Ask him to spot the difference
When given a pair of two other men,
and then when asked for a response
before even asking their name or their profession or their beliefs or values,
He can tell you the differences between them with righteous confidence.
That is the folly of man - he loves to divide the indivisible.

"Nothingness"
In the beginning there was nothingness;
Dark
Cold
Alone
The void called out!
And in the dark,
The nothingness cried-
her false reply to an empty promise.
But the void was foolish-
Weak, he was-
For he wished so longingly for her cry to be true.

"Leak in the boat"
My boat has sprung a leak
Torn against the rocks of spite and
Run ragged by sharp words!
It is the worst type of leak -
Patching the hole seems an impossible task,
A fool's errand -
As my life-blood rushes out into the nothingness of pain,
I feel the difference immediately; cold! I am cold!
But I have found a carpenter who grasps the torn shards with her gentle hands
Soothing the splitters and patching the hole
So that one day
One day
I may again be able to dance above the cobalt sea.

"Multiple destinations"
He had multiple ways to get there
And multiple reasons to run
At the bus station, as he parted ways with her,
he thought
He wanted to leave
To not add to her suffering any longer
This was the most precious of those reasons
He thought
He was just causing her pain.
He wanted to go
To flee
To leave nothing behind
Anything he had to do to ensure that
He left her
Without ever asking what
She thought.

"Same as before"
Same day; same night
The sun-rays and moon-beams intersecting, criss-crossing at the cusp,
A tangled mess at the line where very few leak through-
where day and night try to meet and come together in a mighty crash.
As simple as that mix may sound, the leak of night into day is the moment when
Dark
Light
Come together into color.


“Again and Again”
He dared to venture out again
Explorer met exploration
Alas, again waves of cold contention met his weather-weary ship!
The explorer fought, slamming with a mighty cry into the night, again yelling waves and waves of blunt pain. Yelling.
But he did not falter.
He saw, there on the horizon
That shining beacon again calling out to him
The explorer,
Fraught with the thirst for that treasure, which was again crying and calling to him
Himself calling and crying out.
Pushed on with unwavering desire.


“Fact of Your Act“
Again, the fact I rhyme—
even everyday or all the time—
is fine! In fact you might find,
the same were you to change
nothing would be as it once was.
Starts with one but then oh friend,
multiple rhymes you spoke,
I know quite well, my smile will leak my joy—
you will find it swell! That nothing—
oh yes, it’s true—friend why not join me too?

“Test the waters”
Try to materialize, in your mind before you go,
the multiple people who came, after her, and after him
Beyond the one day when they met. it was like the beginning of a story.
Yesterday, they met and after them would come
Their daughter,
After her would come their son,
after that his brother,
after that his child
She was alone
Until she met the boy
No mother
No father
No sister
Only one remained.
But from her and him grew the many:
Daughter
Son
Grandchild
A tree of life.
Watered with love.`;
const text = new AttributedTextBox(document.getElementById("root"), poem1);
const play = document.getElementById("play").onclick = () => compile_1.run(text.getInnerText(), text.compiled, false);
// text.reset();

},{"./compile":2,"./syntax":8}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GridText {
    constructor(text) {
        this.text = text;
        this.lineIndices = [];
        this.lineIndices.push(0);
        let i = 0;
        for (let c of text) {
            if (c == "\n") {
                this.lineIndices.push(i + 1);
            }
            i += 1;
        }
    }
    line(targetIndex) {
        // FIXME: Inefficient O(n) search
        let i = 0;
        for (let charIndex of this.lineIndices) {
            if (charIndex > targetIndex) {
                return i - 1;
            }
            i += 1;
        }
        return this.lineIndices.length - 1;
    }
    linecol(targetIndex) {
        const line = this.line(targetIndex);
        let column = targetIndex - this.lineIndices[line];
        return [line + 1, column + 1];
    }
}
exports.GridText = GridText;

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tokenize_1 = require("./tokenize");
class TokenGroup {
    constructor(openerToken, groupedTokens, closerToken) {
        this.openerToken = openerToken;
        this.groupedTokens = groupedTokens;
        this.closerToken = closerToken;
        this.toString = () => {
            return `(${this.groupedTokens.toString()})`;
        };
    }
}
exports.TokenGroup = TokenGroup;
function group(tokens) {
    let tokenIter = tokens[Symbol.iterator]();
    function groupUntilClose() {
        let group = [];
        for (let token of tokenIter) {
            if (token instanceof tokenize_1.OpenerToken) {
                const [groupedTokens, closerToken] = groupUntilClose();
                group.push(new TokenGroup(token, groupedTokens, closerToken));
            }
            else if (token instanceof tokenize_1.WordToken) {
                group.push(token);
            }
            else if (token instanceof tokenize_1.CloserToken) {
                return [group, token];
            }
        }
        return [group, null];
    }
    let group = [];
    while (true) {
        const [foundGroup, closerToken] = groupUntilClose();
        group = group.concat(foundGroup);
        if (closerToken) {
            group = [new TokenGroup(null, group, closerToken)];
        }
        else {
            return group;
        }
    }
}
exports.group = group;

},{"./tokenize":9}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const group_1 = require("./group");
const tokenize_1 = require("./tokenize");
const utilities_1 = require("./utilities");
class BuiltIn {
    constructor(name, impl) {
        this.name = name;
        this.impl = impl;
    }
}
exports.BuiltIn = BuiltIn;
class Variable {
    constructor(binder, token) {
        this.binder = binder;
        this.token = token;
        this.toString = () => {
            if (this.binder.variableToken) {
                return this.binder.variableToken.toNormalized();
            }
            else {
                return "_";
            }
        };
    }
}
exports.Variable = Variable;
class Lambda {
    constructor(keywordToken, variableToken) {
        this.keywordToken = keywordToken;
        this.variableToken = variableToken;
        this.toString = () => {
            const name = this.variableToken ? this.variableToken.toNormalized() : "_";
            const body = this.body ? this.body.toString() : "_";
            return `λ${name}.${body}`;
        };
    }
}
exports.Lambda = Lambda;
class Application {
    constructor(lambda, argument) {
        this.lambda = lambda;
        this.argument = argument;
        this.toString = () => {
            return `(${this.lambda.toString()}) (${this.argument.toString()})`;
        };
    }
}
exports.Application = Application;
class LetIn {
    constructor(headerToken, variableToken, variableValue, body) {
        this.headerToken = headerToken;
        this.variableToken = variableToken;
        this.variableValue = variableValue;
        this.body = body;
        this.toString = () => {
            return `${this.toStringExcludingBody()}\n` + (this.body ? this.body.toString() : "_");
        };
    }
    toStringExcludingBody() {
        const name = this.variableToken ? this.variableToken.toNormalized() : "_";
        const value = this.variableValue ? this.variableValue.toString() : "_";
        return `let ${name} = ${value};`;
    }
}
exports.LetIn = LetIn;
class Scope {
    constructor() {
        this.base = {};
    }
    push(binder) {
        const name = binder.variableToken.toNormalized();
        if (!(name in this.base)) {
            this.base[name] = [];
        }
        this.base[name].unshift(binder);
    }
    pop(binder) {
        const name = binder.variableToken.toNormalized();
        if (name in this.base) {
            this.base[name].shift();
            if (this.base[name].length == 0) {
                delete this.base[name];
            }
        }
    }
    lookup(name) {
        if (name in this.base) {
            return this.base[name][0];
        }
        else {
            return null;
        }
    }
}
function parse(keyword, groups, globals = {}) {
    let scope = new Scope();
    function parseGroups(tokens) {
        let result;
        function append(expr) {
            if (!result) {
                result = expr;
            }
            else {
                result = new Application(result, expr);
            }
            return result;
        }
        let tokenIter = new utilities_1.PeekableIterator(tokens[Symbol.iterator]());
        for (let token of tokenIter) {
            if (token instanceof group_1.TokenGroup) {
                const group = parseGroups(token.groupedTokens);
                // Ignore empty groups
                if (group) {
                    append(group);
                }
            }
            else if (token instanceof tokenize_1.Token) {
                if (token.toNormalized() == keyword) {
                    // Determine binding name
                    let { value: nextToken, done } = tokenIter.peek();
                    let variableToken;
                    if (!done && nextToken instanceof tokenize_1.WordToken) {
                        variableToken = nextToken;
                        tokenIter.next();
                    }
                    // Parse body with binding in scope
                    const lambda = new Lambda(token, variableToken);
                    if (lambda.variableToken) {
                        scope.push(lambda);
                    }
                    const body = parseGroups(Array.from(tokenIter));
                    if (lambda.variableToken) {
                        scope.pop(lambda);
                    }
                    lambda.body = body;
                    // Return lambda node
                    return append(lambda);
                }
                else {
                    const local = scope.lookup(token.toNormalized());
                    if (local) {
                        append(new Variable(local, token));
                    }
                    else if (token.toNormalized() in globals) {
                        append(new Variable(globals[token.toNormalized()], token));
                    }
                }
            }
        }
        return result;
    }
    return parseGroups(groups);
}
exports.parse = parse;
function* traverse(expr) {
    yield expr;
    if (expr instanceof Lambda) {
        if (expr.body) {
            yield* traverse(expr.body);
        }
    }
    else if (expr instanceof Variable) {
        // no-op
    }
    else if (expr instanceof Application) {
        yield* traverse(expr.lambda);
        yield* traverse(expr.argument);
    }
    else if (expr instanceof LetIn) {
        if (expr.variableValue) {
            yield* traverse(expr.variableValue);
        }
        if (expr.body) {
            yield* traverse(expr.body);
        }
    }
}
exports.traverse = traverse;

},{"./group":5,"./tokenize":9,"./utilities":10}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utilities_1 = require("./utilities");
const tokenize_1 = require("./tokenize");
const group_1 = require("./group");
class TitleSection {
    constructor(title, author, publisher, year) {
        this.title = title;
        this.author = author;
        this.publisher = publisher;
        this.year = year;
    }
}
exports.TitleSection = TitleSection;
class PoemSection {
    constructor(headerToken, bodyTokens) {
        this.headerToken = headerToken;
        this.bodyTokens = bodyTokens;
        this.bodyGroups = group_1.group(bodyTokens);
    }
}
exports.PoemSection = PoemSection;
class WorksCitedSection {
}
exports.WorksCitedSection = WorksCitedSection;
function skipNewLines(tokens) {
    let didSkip = false;
    while (!tokens.peek().done && (tokens.peek().value instanceof tokenize_1.NewLineToken)) {
        didSkip = true;
        tokens.next();
    }
    return didSkip;
}
// TODO: Return other sections too
function parsePoemSection(tokens) {
    let { value: headerToken, done } = tokens.peek();
    if (done) {
        return null;
    }
    if (!(headerToken instanceof tokenize_1.HeaderToken)) {
        return null;
    }
    tokens.next();
    if (!skipNewLines(tokens)) {
        // TODO: Emit warning!
    }
    let bodyTokens = [];
    while (!tokens.peek().done && !(tokens.peek().value instanceof tokenize_1.HeaderToken)) {
        const token = tokens.next().value;
        if (!(token instanceof tokenize_1.NewLineToken)) {
            bodyTokens.push(token);
        }
    }
    return new PoemSection(headerToken, bodyTokens);
}
function* section(_tokens) {
    const tokens = new utilities_1.PeekableIterator(_tokens);
    // TODO: Parse title
    while (true) {
        skipNewLines(tokens);
        const result = parsePoemSection(tokens);
        if (result) {
            yield result;
        }
        else {
            break;
        }
    }
    // TODO: Parse works cited section
}
exports.section = section;

},{"./group":5,"./tokenize":9,"./utilities":10}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parse_1 = require("./parse");
const utilities_1 = require("./utilities");
var HighlightType;
(function (HighlightType) {
    HighlightType[HighlightType["Bold"] = 1] = "Bold";
    HighlightType[HighlightType["Underline"] = 2] = "Underline";
})(HighlightType = exports.HighlightType || (exports.HighlightType = {}));
class Highlight {
    constructor(region, type) {
        this.region = region;
        this.type = type;
    }
}
exports.Highlight = Highlight;
// TODO: Consider imported functions
function* highlightRegions(module) {
    if (!module.program) {
        return;
    }
    ;
    for (const expr of parse_1.traverse(module.program)) {
        if (expr instanceof parse_1.LetIn) {
            // no-op
        }
        else if (expr instanceof parse_1.Lambda) {
            const startIndex = expr.keywordToken.startIndex();
            const endIndex = expr.variableToken ? expr.variableToken.endIndex() : expr.keywordToken.endIndex();
            yield new Highlight(new utilities_1.Interval(startIndex, endIndex), HighlightType.Underline);
        }
        else if (expr instanceof parse_1.Variable) {
            yield new Highlight(expr.token.substring.interval, HighlightType.Bold);
        }
        else if (expr instanceof parse_1.Application) {
            // no-op
        }
    }
}
exports.highlightRegions = highlightRegions;

},{"./parse":6,"./utilities":10}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utilities_1 = require("./utilities");
class Token {
    constructor(substring) {
        this.substring = substring;
        this.toString = () => {
            return this.substring.toString();
        };
    }
    startIndex() { return this.substring.startIndex(); }
    endIndex() { return this.substring.endIndex(); }
}
exports.Token = Token;
class HeaderToken extends Token {
    constructor(substring, innerText, nameToken, isClosed) {
        super(substring);
        this.innerText = innerText;
        this.nameToken = nameToken;
        this.isClosed = isClosed;
    }
}
exports.HeaderToken = HeaderToken;
class WordToken extends Token {
    toNormalized() {
        // Append underscore since we transpile to JS,
        // which reserves certain words.
        return this.toString().toLowerCase();
    }
}
exports.WordToken = WordToken;
class OpenerToken extends Token {
}
exports.OpenerToken = OpenerToken;
class CloserToken extends Token {
}
exports.CloserToken = CloserToken;
class NewLineToken extends Token {
}
exports.NewLineToken = NewLineToken;
const startWord = /[a-z']/i;
const endWord = /[^a-z']/i;
const groupOpener = /,/;
const groupCloser = /\./;
const headerDelimiter = /"|“|”|\*/;
function* tokenize(text) {
    let charIter = text[Symbol.iterator]();
    let index = 0;
    let wordStart = -1;
    for (let char of charIter) {
        if (wordStart == -1 && char.match(startWord)) {
            wordStart = index;
        }
        else if (wordStart > -1 && char.match(endWord)) {
            yield new WordToken(new utilities_1.Substring(text, new utilities_1.Interval(wordStart, index)));
            wordStart = -1;
        }
        if (char == '\n') {
            yield new NewLineToken(new utilities_1.Substring(text, new utilities_1.Interval(index, index + 1)));
        }
        else if (char == ',') {
            yield new OpenerToken(new utilities_1.Substring(text, new utilities_1.Interval(index, index + 1)));
        }
        else if (char == '.') {
            yield new CloserToken(new utilities_1.Substring(text, new utilities_1.Interval(index, index + 1)));
        }
        else if (char.match(headerDelimiter)) {
            utilities_1.assert(wordStart == -1);
            let nameToken;
            const headerStart = index;
            index += 1;
            for (let char of charIter) {
                if (!nameToken && wordStart == -1 && char.match(startWord)) {
                    wordStart = index;
                }
                else if (wordStart > -1 && char.match(endWord)) {
                    nameToken = new WordToken(new utilities_1.Substring(text, new utilities_1.Interval(wordStart, index)));
                    wordStart = -1;
                }
                if (char.match(headerDelimiter) || char == '\n') {
                    yield new HeaderToken(new utilities_1.Substring(text, new utilities_1.Interval(headerStart, index + 1)), new utilities_1.Substring(text, new utilities_1.Interval(headerStart + 1, index)), nameToken, char.match(headerDelimiter) != null);
                    break;
                }
                index += 1;
            }
        }
        index += 1;
    }
}
exports.tokenize = tokenize;

},{"./utilities":10}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AssertionError extends Error {
}
exports.AssertionError = AssertionError;
function assert(condition, message) {
    if (!condition) {
        throw new AssertionError(message);
    }
}
exports.assert = assert;
class Interval {
    constructor(_startIndex, _endIndex) {
        this._startIndex = _startIndex;
        this._endIndex = _endIndex;
        this.toString = () => {
            return `${this.startIndex()}..<${this.endIndex()}`;
        };
        assert(_startIndex <= _endIndex, `invalid substring indices: ${_startIndex}..<${_endIndex}`);
    }
    startIndex() { return this._startIndex; }
    endIndex() { return this._endIndex; }
}
exports.Interval = Interval;
class Substring {
    constructor(base, interval) {
        this.base = base;
        this.interval = interval;
        this.toString = () => {
            return this.base.substring(this.interval.startIndex(), this.interval.endIndex());
        };
    }
    startIndex() { return this.interval.startIndex(); }
    endIndex() { return this.interval.endIndex(); }
    // FIXME: Gross; remove?
    extendThrough(other) {
        assert(this.base == other.base, "Cannot extend with substring of different base.");
        return new Substring(this.base, new Interval(this.startIndex(), other.endIndex()));
    }
}
exports.Substring = Substring;
class PeekableIterator {
    constructor(iterator) {
        this.iterator = iterator;
        this._next = null;
    }
    [Symbol.iterator]() {
        return this;
    }
    next() {
        if (this._next) {
            const next = this._next;
            this._next = null;
            return next;
        }
        else {
            return this.iterator.next();
        }
    }
    peek() {
        if (!this._next) {
            this._next = this.iterator.next();
        }
        return this._next;
    }
}
exports.PeekableIterator = PeekableIterator;

},{}]},{},[3]);
