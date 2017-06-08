export class AssertionError extends Error { }
export function assert(condition: boolean, message?: string) {
    if (!condition) {
        throw new AssertionError(message);
    }
}

export class Interval {
    constructor(private _startIndex: number,
                private _endIndex: number) {
        assert(_startIndex <= _endIndex,
               `invalid substring indices: ${_startIndex}..<${_endIndex}`);
    }

    startIndex(): number { return this._startIndex; }
    endIndex(): number { return this._endIndex; }

    public toString = () : string => {
        return `${this.startIndex()}..<${this.endIndex()}`;
    }
}

export class Substring {
    constructor(public base: string,
                private _interval: Interval) { }

    startIndex(): number { return this._interval.startIndex(); }
    endIndex():   number { return this._interval.endIndex(); }

    public toString = () : string => {
        return this.base.substring(this._interval.startIndex(),
                                    this._interval.endIndex());
    }

    // FIXME: Gross; remove?
    extendThrough(other: Substring): Substring {
        assert(this.base == other.base,
               "Cannot extend with substring of different base.");
        return new Substring(this.base, new Interval(this.startIndex(), other.endIndex()));
    }
}

export class PeekableIterator<T> implements Iterator<T> {
    constructor(public iterator: Iterator<T>) { }

    [Symbol.iterator](): this {
        return this;
    }

    private _next: IteratorResult<T> | null = null;
    public next(): IteratorResult<T> {
        if (this._next) {
            const next = this._next;
            this._next = null;
            return next;
        } else {
            return this.iterator.next();
        }
    }
    public peek(): IteratorResult<T> {
        if (!this._next) {
            this._next = this.iterator.next();
        }
        return this._next;
    }
}
