enum StringArgumentType {
    DOUBLE_QUOTE = '"',
    SINGLE_QUOTE = '\''
}

const AsyncFunction: Function = async function () {}.constructor;

const byteSubUnits: string[] = "KMGT".split("");
const upperCaseAlpha: string[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const upperCaseOddCharacters: StringObject<number> = {
    '0': 1,
    '1': 0,
    '2': 5,
    '3': 7,
    '4': 9,
    '5': 13,
    '6': 15,
    '7': 17,
    '8': 19,
    '9': 21,
    'A': 1,
    'B': 0,
    'C': 5,
    'D': 7,
    'E': 9,
    'F': 13,
    'G': 15,
    'H': 17,
    'I': 19,
    'J': 21,
    'K': 2,
    'L': 4,
    'M': 18,
    'N': 20,
    'O': 11,
    'P': 3,
    'Q': 6,
    'R': 8,
    'S': 12,
    'T': 14,
    'U': 16,
    'V': 10,
    'W': 22,
    'X': 25,
    'Y': 24,
    'Z': 23
};
const upperCaseEvenCharacters: StringObject<number> = {
    '0': 0,
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    'A': 0,
    'B': 1,
    'C': 2,
    'D': 3,
    'E': 4,
    'F': 5,
    'G': 6,
    'H': 7,
    'I': 8,
    'J': 9,
    'K': 10,
    'L': 11,
    'M': 12,
    'N': 13,
    'O': 14,
    'P': 15,
    'Q': 16,
    'R': 17,
    'S': 18,
    'T': 19,
    'U': 20,
    'V': 21,
    'W': 22,
    'X': 23,
    'Y': 24,
    'Z': 25
};
const invalidScoreCouponStrErr: Error = new Error("Invalid score coupon string.");

class VibRibbonScore {
    readonly scoreCoupons: string;
    readonly coupons: number;
    readonly couponNum: number;
    readonly couponValues: number[][];

    readonly MAX_INTEGER: number = 0;

    constructor(scoreCoupons: string = "ABCDEFGHIJKLMNO"){
        this.scoreCoupons = scoreCoupons;

        this.coupons = this.scoreCoupons.length;
        this.couponNum = Math.floor(this.coupons / 2);
        this.couponValues = [];

        for(let couponIdx: number = 0; couponIdx < this.coupons; couponIdx++){
            this.couponValues.push([ couponIdx ]);

            for(let valueIdx: number = 1; valueIdx < this.couponNum; valueIdx++){
                this.couponValues[couponIdx].push((couponIdx <= 0) ? 0 : (this.couponValues[couponIdx][valueIdx - 1] + this.couponValues[couponIdx - 1][valueIdx]));
            }

            Object.freeze(this.couponValues[couponIdx]);
        }

        Object.freeze(this.couponValues);

        if(this.coupons > 0){
            this.MAX_INTEGER = (this.couponValues.at(-1) as number[]).reduce((prev: number, curr: number) => (prev + curr));
        }
    }

    private findClosestCouponIndex(i: number, n: number): number {
        if((i < 0) || (i >= this.couponNum)) throw new Error("Negative or overflowing index: i");

        let minDiff: number = Infinity, closestIndex: number = 0;

        for(let x: number = 0; x < this.coupons; x++){
            let diff: number = (n - this.couponValues[x][i]);

            if((diff >= 0) && (diff < minDiff)){
                minDiff = diff;
                closestIndex = x;
            }
        }

        return closestIndex;
    }

    couponsToNumber(scoreCoupons: string): number {
        if(scoreCoupons.length !== this.couponNum) throw invalidScoreCouponStrErr;

        let prevCouponIdx: number = -1, res: number = 0;

        for(let i: number = 0; i < this.couponNum; i++){
            let couponIdx: number = this.scoreCoupons.indexOf(scoreCoupons[i]);

            if((couponIdx < 0) || ((prevCouponIdx >= 0) && (couponIdx > prevCouponIdx))) throw invalidScoreCouponStrErr;

            res += this.couponValues[couponIdx][(this.couponNum - 1) - i];

            prevCouponIdx = couponIdx;
        }

        return res;
    }

    numberToCoupons(n: number): string {
        let k: number = n, i: number = 0;
        let scoreCoupons: string = "";

        for(; i < this.couponNum; i++){
            let revIdx: number = this.couponNum - (i + 1), idxFinder = this.findClosestCouponIndex(revIdx, k);

            scoreCoupons += this.scoreCoupons[idxFinder];
            k -= this.couponValues[idxFinder][revIdx];
        }

        return scoreCoupons;
    }
}

function parseArguments(str: string): string[] {
    const spaceChar: string = ' ';
    const escapeChar: string = '\\';

    let args: string[] = [];
    let curArgBuf: string = "";

    let sStart: number = 0;
    let stringArgType: Nullable<StringArgumentType> = null;
    let escaped: boolean = false;

    for(let i: number = 0; i < str.length; i++){
        const char: string = str[i], nextChar: string = str[i + 1];

        if(
            (
                (
                    (char === spaceChar) &&
                    (stringArgType === null)
                ) ||
                (
                    (
                        (char === StringArgumentType.DOUBLE_QUOTE) ||
                        (char === StringArgumentType.SINGLE_QUOTE)
                    ) &&
                    (
                        !escaped ?
                        (stringArgType !== (stringArgType = ((stringArgType === null) ? char : ((stringArgType === char) ? null : stringArgType))))
                        : true
                    )
                )
            ) &&
            !escaped
        ){
            if(i !== sStart){
                args.push(curArgBuf);

                curArgBuf = "";
            }

            sStart = i + 1;
        } else {
            if(
                (char === escapeChar) &&
                (
                    (
                        (stringArgType === null) &&
                        (nextChar === spaceChar)
                    ) ||
                    (
                        ((stringArgType === null) || (stringArgType === StringArgumentType.DOUBLE_QUOTE)) &&
                        (nextChar === StringArgumentType.DOUBLE_QUOTE)
                    ) ||
                    (
                        ((stringArgType === null) || (stringArgType === StringArgumentType.SINGLE_QUOTE)) &&
                        (nextChar === StringArgumentType.SINGLE_QUOTE)
                    ) ||
                    (
                        (nextChar === escapeChar)
                    )
                )
            ){
                escaped = !escaped;
            } else {
                escaped = false;
            }

            if(!escaped) curArgBuf += char;
        }

        if(i === (str.length - 1)){
            if(stringArgType !== null) throw new Error("MISSING_QUOTATION_MARK_FCHAR");

            if(curArgBuf.length > 0){
                args.push(curArgBuf);

                curArgBuf = "";
            }
        }
    }

    return args;
}

function toByteStr(nBytes: number): string {
    let subUnit: number = -1;
    let k: number = nBytes;

    while((k >= 1000) && !((subUnit + 1) >= byteSubUnits.length)){
        k /= 1024;

        subUnit++;
    }

    return (k.toFixed((subUnit >= 0) ? 2 : 0) + ' ' + (((subUnit >= 0) ? byteSubUnits[subUnit] : "") + 'B'));
}

function nonEnumEntries(obj: object): [string, any][] {
    const entries: [string, any][] = [];

    for(const prop in obj){
        const vObj: any = (obj as StringObject<any>)[prop];

        entries.push([prop, (((vObj instanceof Function) || (vObj instanceof AsyncFunction)) ? vObj.bind(obj) : vObj)]);
    }

    return entries;
}

function stripANSI(str: string): string {
    return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
}

function isASCII(str: string): boolean {
    for(let i: number = 0; i < str.length; i++){
        const char: number = str.charCodeAt(i);

        if((char < 0x20) || (char > 0x7E)) return false;
    }

    return true;
}

function convNonASCII(str: string): string {
    let s: string = "";

    for(let i: number = 0; i < str.length; i++){
        const hex: string = str.charCodeAt(i).toString(16);

        s += (isASCII(str[i]) ? str[i] : ("\\x" + (((hex.length <= 1) ? "0" : "") + hex.toUpperCase())));
    }

    return s;
}

function calculateTaxIDCheckCharacter(taxID: string): string {
    const upperCaseTaxID: string = taxID.toUpperCase();

    let oddSum: number = 0, evenSum = 0;

    for(let i: number = 0; i < upperCaseTaxID.length; i++){
        if(!upperCaseOddCharacters.hasOwnProperty(upperCaseTaxID[i]) && !upperCaseEvenCharacters.hasOwnProperty(upperCaseTaxID[i])) throw new Error("Invalid character.");

        if(((i + 1) % 2) > 0){
            oddSum += upperCaseOddCharacters[upperCaseTaxID[i]];
        } else {
            evenSum += upperCaseEvenCharacters[upperCaseTaxID[i]];
        }
    }

    const idx: number = (oddSum + evenSum) % 26;

    if(idx > upperCaseAlpha.length) throw new Error("Invalid Tax ID");

    return upperCaseAlpha[idx];
}

function getElementByXPath(xpath: string): (HTMLElement | any) {
    return document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    ).singleNodeValue;
}

async function asyncTimeout(ms: number): Promise<void> {
    return (new Promise((resolve) => setTimeout(resolve, ms)));
}

async function promisePooler(
    maxConcurrentPromises: number,
    promiseFuncs: ((() => Promise<any>) | ({ asyncFunc: (...args: any[]) => Promise<any>, args: any[] }))[],
    onRejected?: (err: any, stopPool: Function) => void,
    onFulfilled?: (value: any, stopPool: Function) => void
): Promise<void> {
    let pendingPromises: number = 0, promiseIdx: number = 0, resolve: Nullable<Function> = null, stop: boolean = false;

    function stopPool(){
        stop = true;
    }

    function execPromise(): void {
        if(pendingPromises >= maxConcurrentPromises) return;
        if((promiseIdx >= promiseFuncs.length) || stop){
            if(pendingPromises <= 0) resolve?.();

            return;
        }

        pendingPromises++;

        const promise: ((() => Promise<any>) | { asyncFunc: (...args: any[]) => Promise<any>, args: any[] }) = promiseFuncs[promiseIdx++];

        (promise instanceof Function ? promise() : promise.asyncFunc(...promise.args)).then((value: any) => {
            pendingPromises--;

            onFulfilled?.(value, stopPool);

            execPromise();
        }).catch((err: any) => {
            pendingPromises--;

            onRejected?.(err, stopPool);

            execPromise();
        });

        execPromise();
    }

    return (new Promise((_resolve) => { resolve = _resolve; execPromise(); }));
}

function findMissingMapKey(map: Map<number, any>): number {
    let prevKey: number = -1, mapKey: number = 0;

    for(const [ key ] of map){
        if((key - 1) > prevKey){
            mapKey = prevKey + 1;

            if(map.has(mapKey)) continue;

            break;
        }

        prevKey = key;
    }

    if((map.size > 0) && (mapKey <= 0)) mapKey = prevKey + 1;

    return mapKey;
}

export {
    AsyncFunction,
    VibRibbonScore,
    parseArguments,
    toByteStr,
    nonEnumEntries,
    stripANSI,
    isASCII,
    convNonASCII,
    calculateTaxIDCheckCharacter,
    getElementByXPath,
    asyncTimeout,
    promisePooler,
    findMissingMapKey
}
