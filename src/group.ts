import { OpenerToken, CloserToken, WordToken } from "./tokenize";

export class TokenGroup {
    constructor(
        public openerToken: OpenerToken | null,
        public groupedTokens: TokenTree[],
        public closerToken: CloserToken | null
    ) { }

    public toString = (): string => {
        return `(${this.groupedTokens.toString()})`;
    }
}
export type TokenTree = WordToken | TokenGroup;

export function group(tokens: (WordToken | OpenerToken | CloserToken)[]): TokenTree[] {
   let tokenIter = tokens[Symbol.iterator]();

   function groupUntilClose(): [TokenTree[], CloserToken | null] {
       let group: TokenTree[] = [];
       for (let token of tokenIter) {
           if (token instanceof OpenerToken) {
               const [groupedTokens, closerToken] = groupUntilClose()
               group.push(new TokenGroup(token, groupedTokens, closerToken))
           } else if (token instanceof WordToken) {
               group.push(token);
           } else if (token instanceof CloserToken) {
               return [group, token];
           }
       }
       return [group, null];
   }

   let group: TokenTree[] = []
   while (true) {
       const [foundGroup, closerToken] = groupUntilClose();
       group = group.concat(foundGroup);

       if (closerToken) { // fix imbalance
           group = [new TokenGroup(null, group, closerToken)];
       } else {
           return group;
       }
   }
}
