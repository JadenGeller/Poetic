export class GridText {
    private lineIndices: number[] = [];
    constructor(public text: string) {
        this.lineIndices.push(0);
        let i = 0;
        for (let c of text) {
            if (c == "\n") {
                this.lineIndices.push(i + 1);
            }
            i += 1;
        }
    }

    line(targetIndex: number): number {
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

    linecol(targetIndex: number): [number, number] {
        const line = this.line(targetIndex);
        let column = targetIndex - this.lineIndices[line];
        return [line + 1, column + 1];
    }
}
