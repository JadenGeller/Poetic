import { HighlightType, Highlight, highlightRegions } from "./syntax";
import { Module, compile } from "./compile";
import { Interval } from "./utilities"


class AttributedTextBox {
    private currentTagCharCount: number;

    constructor(private div: HTMLElement, private internalHTMLState: string) {
        this.currentTagCharCount = 0;
        div.contentEditable = "true";
    }

    commit() {
        this.div.innerHTML = this.internalHTMLState;
    }

    reset() {
        this.div.innerText = this.div.innerText;
    }

    makeRangeTagged(startIndex: number, endIndex: number, openTag: string, closeTag: string) {
        startIndex += this.currentTagCharCount;
        endIndex += this.currentTagCharCount;
        let oldHTML = this.internalHTMLState;
        let newHTML = oldHTML.slice(0, startIndex) + openTag + oldHTML.slice(startIndex, endIndex) + closeTag + oldHTML.slice(endIndex);
        this.internalHTMLState = newHTML;
        this.currentTagCharCount += (openTag.length + closeTag.length);
    }

    boldRange(startIndex: number, endIndex: number) {
        this.makeRangeTagged(startIndex, endIndex, "<b>", "</b>");
    }
    underlineRange(startIndex: number, endIndex: number) {
        this.makeRangeTagged(startIndex, endIndex, "<ins>", "</ins>")
    }
    italicizeRange(startIndex: number, endIndex: number) {
        this.makeRangeTagged(startIndex, endIndex, "<i>", "</i>")
    }
    markRange(startIndex: number, endIndex: number) {
        this.makeRangeTagged(startIndex, endIndex, "<mark>", "</mark>")
    }
}

let poem1 =
`"Nothing is Lost"
Nothing gained,
Nothing lost -
until all is lost.`

const text = new AttributedTextBox(document.getElementById("root")!, poem1);

let poem1_compiled = compile(poem1);
let poem1_iterator = highlightRegions(poem1_compiled);

for (let c of poem1_iterator) {
    console.log(c.region);
    if (c.type == HighlightType.Bold) {
        text.boldRange(c.region.startIndex(), c.region.endIndex());
    }
    else {
        text.underlineRange(c.region.startIndex(), c.region.endIndex());
    }
}

text.commit();

// text.reset();

