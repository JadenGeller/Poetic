import { HighlightType, Highlight, highlightRegions } from "./syntax";
import { Module, compile } from "./compile";
import { Interval } from "./utilities"

// Due to inconsistencies in how browsers handle contenteditable divs, this
// code is only confirmed to work in Firefox.

class AttributedTextBox {
    private currentTagCharCount: number;
    private internalHTMLState: string;

    constructor(private div: HTMLElement, initialInput: string) {
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

    performSyntaxHighlighting() {
        this.currentTagCharCount = 0;
        this.internalHTMLState = this.div.innerText;
        let text_compiled = compile(this.div.innerText);
        let text_iterator = highlightRegions(text_compiled);
        for (let c of text_iterator) {
            if (c.type == HighlightType.Bold) {
                this.boldRange(c.region.startIndex(), c.region.endIndex());
            }
            else {
                this.underlineRange(c.region.startIndex(), c.region.endIndex());
            }
        }
        this.commit();
    }
}

let poem1 =
`"Nothing is Lost"
Nothing gained,
Nothing lost -
until all is lost.`

const text = new AttributedTextBox(document.getElementById("root")!, poem1);

// text.reset();
