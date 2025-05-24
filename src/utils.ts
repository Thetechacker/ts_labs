import { convNonASCII, stripANSI, calculateTaxIDCheckCharacter } from "./webfriendlyutils";
import fs from "node:fs";
import path from "node:path";
import cp from "node:child_process";
import chalk from "chalk";

type LoggerColorSchemeT = chalk.Chalk;

enum TextPosition {
    Left,
    Center,
    Right
}

enum TextFocus {
    Left,
    Right
}

enum Gender {
    Male,
    Female
}

interface LoggerColorScheme {
    "_": LoggerColorSchemeT
    "__": LoggerColorSchemeT,

    log: LoggerColorSchemeT,
    info: LoggerColorSchemeT,
    warn: LoggerColorSchemeT,
    error: LoggerColorSchemeT,
    debug: LoggerColorSchemeT
}

interface TextBar {
    readonly textBar: string;
    readonly text: string;
    readonly textPosition: TextPosition;
    readonly textFocus: TextFocus;
    readonly barWidth: number;
    readonly textColor: chalk.Chalk;
    readonly bgColor: chalk.Chalk;
}

interface Comune {
    sigla_provincia: string,
    codice_istat: string,
    denominazione_ita_altra: string,
    denominazione_ita: string,
    denominazione_altra: string,
    flag_capoluogo: string,
    codice_belfiore: string,
    lat: string,
    lon: string,
    superficie_kmq: string,
    codice_sovracomunale: string
}

const spaceChar: string = ' ',
    leftSpaceChar: string = spaceChar,
    rightSpaceChar: string = spaceChar,
    moreLeftStr: string = '<',
    moreRightStr: string = "...",
    moreLeftStrColor: chalk.Chalk = chalk.white,
    moreRightStrColor: chalk.Chalk = chalk.black,
    moreLeftBgStrColor: chalk.Chalk = chalk.bgMagentaBright,
    moreRightBgStrColor: chalk.Chalk = chalk.bgWhite;
const databaseComuniPath: string = path.join(__dirname, "../assets/gi_comuni.json");
const comuni: Nullable<Comune[]> = (fs.existsSync(databaseComuniPath) && fs.statSync(databaseComuniPath).isFile()) ? JSON.parse(fs.readFileSync(databaseComuniPath, "utf-8")) : null;
const includeExConsonants: boolean = true;
const upperCaseExConsonants: string[] = "JHRWY".split("");
const upperCaseConsonants: string[] = [ ..."BCDFGHLMNPQRSTVZ", ...(includeExConsonants ? upperCaseExConsonants : []) ];
const upperCaseVowels: string[] = "AEIOU".split("");
const upperCaseMonthCharacters: string[] = "ABCDEHLMPRST".split("");

let loggerNames: string[] = [];

class Logger {
    public static colorScheme: LoggerColorScheme = {
        "_": chalk.greenBright,
        "__": chalk.magentaBright,

        log: chalk.gray,
        info: chalk.white,
        warn: chalk.yellow,
        error: chalk.redBright,
        debug: chalk.magentaBright
    };

    private _loggerName: string;
    private _disposed: boolean = false;

    public debugMode: boolean = false;

    get loggerName(): string {
        return this._loggerName;
    }

    get disposed(): boolean {
        return this._disposed;
    }

    constructor(loggerName: string = "default", debugMode: boolean = false){
        if(loggerNames.includes(loggerName)) throw new Error(`Logger "${loggerName}" already exists.`);

        this._loggerName = loggerName;
        this.debugMode = debugMode;

        loggerNames.push(this._loggerName);
    }

    public log   (...args: any[]): void { this._log("log",   ...args) }
    public info  (...args: any[]): void { this._log("info",  ...args) }
    public warn  (...args: any[]): void { this._log("warn",  ...args) }
    public error (...args: any[]): void { this._log("error", ...args) }
    public debug (...args: any[]): void { this._log("debug", ...args) }

    private _log(logType: string, ...args: any[]): void {
        if(!this.debugMode && (logType === "debug")) return;

        (console as StringObject<any>)[logType]([Logger.colorScheme["_"](new Date().toISOString()), (Logger.colorScheme as StringObject<any>)[logType](logType.toUpperCase()), Logger.colorScheme["__"]("@" + this.loggerName)].map((str: string) => ("[" + str + "]")).join(" "), ...args);
    }

    dispose(): void {
        if(this._disposed) throw new Error("This logger has already been disposed.");

        loggerNames.splice(loggerNames.indexOf(this._loggerName), 1);

        this._disposed = true;
    }
}

function findIndexOfEndingSequence(buf: Buffer, endBuf: Buffer): number {
    let index: number = -1;

    for(let i: number = 0; i < endBuf.length + Math.min(0, buf.length - endBuf.length); i++){
        let equal: boolean = true;

        for(let n: number = i; n >= 0; n--){
            if(buf[buf.length - (n + 1)] !== endBuf[i - n]){
                equal = false;

                break;
            }
        }

        if(equal) index = buf.length - (i + 1);
    }

    return index;
}

function makeTextBar
    (
    text: string,
    barWidth: number = 30,
    textPosition: TextPosition = TextPosition.Center,
    textFocus: TextFocus = TextFocus.Left,
    textColor: chalk.Chalk = chalk.black,
    bgColor: chalk.Chalk = chalk.bgCyanBright
    ): TextBar {
    let txt: string = convNonASCII(stripANSI(text));
    let tBefore: string = "";
    let tAfter: string = "";

    switch(textPosition){
        case TextPosition.Left:
            break;
        case TextPosition.Center:
            tBefore += bgColor(leftSpaceChar.repeat(Math.max(0, (barWidth - txt.length) / 2)));
            break;
        case TextPosition.Right:
            tBefore += bgColor(leftSpaceChar.repeat(Math.max(0, barWidth - txt.length)));
            break;
    }

    switch(textPosition){
        case TextPosition.Left:
            tAfter += bgColor(rightSpaceChar.repeat(Math.max(0, barWidth - txt.length)));
            break;
        case TextPosition.Center:
            tAfter += bgColor(rightSpaceChar.repeat(Math.max(0, Math.ceil((barWidth - txt.length) / 2))));
            break;
        case TextPosition.Right:
            break;
    }

    if(txt.length > barWidth){
        txt = txt.slice(...((textFocus === TextFocus.Left) ? [0, Math.max(0, barWidth - moreRightStr.length)] : [(txt.length - barWidth) + moreLeftStr.length, txt.length]));

        if(textFocus === TextFocus.Left){
            tAfter = moreRightBgStrColor(moreRightStrColor(moreRightStr));
        } else {
            tBefore = moreLeftBgStrColor(moreLeftStrColor(moreLeftStr));
        }
    }

    return {
        textBar: tBefore + bgColor(textColor(txt)) + tAfter,
        text,
        textPosition,
        textFocus,
        barWidth,
        textColor,
        bgColor
    };
}

function addZero(num: number): string { // :sob:
    const numStr: string = num.toString();

    return ((numStr.split('.')[0].length <= 1) ? '0' : "") + numStr;
}

function calculateTaxID(
    name: string, surname: string, gender: Gender, birthPlace: string, provinceAbbreviation: string, birthDate: Date
): string {
    if(comuni === null) throw new Error("Missing city hall database.");

    if(isNaN(birthDate.getTime())) throw new Error("Invalid birth date.");

    let taxID: string = "";

    const comune: Maybe<Comune> = comuni.find(c => (c.sigla_provincia === provinceAbbreviation.toUpperCase()) && (c.denominazione_ita.toUpperCase() === birthPlace.toUpperCase()));

    if(comune === undefined) throw new Error(`Couldn't find "${birthPlace}", province: "${provinceAbbreviation}"`);

    const upperCaseName: string = name.toUpperCase(), upperCaseSurname: string = surname.toUpperCase();

    const nameConsonants: string[] = upperCaseName.split(" ").join("").split("").filter(c => upperCaseConsonants.includes(c)), surnameConsonants: string[] = upperCaseSurname.split("").filter(c => upperCaseConsonants.includes(c));
    const nameVowels: string[] = upperCaseName.split(" ").join("").split("").filter(c => upperCaseVowels.includes(c)), surnameVowels: string[] = upperCaseSurname.split("").filter(c => upperCaseVowels.includes(c));

    if(surnameConsonants.length >= 3){
        taxID += surnameConsonants.slice(0, 3).join("");
    } else if(surnameConsonants.length === 2) {
        taxID += surnameConsonants.join("") + surnameVowels[0];
    } else if((surnameConsonants.length === 1) && (surnameVowels.length === 2)){
        taxID += surnameConsonants[0] + surnameVowels.join("");
    } else if((surnameConsonants.length === 1) && (surnameVowels.length === 1)){
        taxID += surnameConsonants[0] + surnameVowels[0] + 'X';
    } else if(surnameVowels.length === 2){
        taxID += surnameVowels.join("") + 'X';
    } else {
        // taxID += "---";

        throw new Error("Invalid surname.")
    }

    if(nameConsonants.length >= 4){
        taxID += nameConsonants[0] + nameConsonants[2] + nameConsonants[3];
    } else if(nameConsonants.length === 3){
        taxID += nameConsonants.join("");
    } else if(nameConsonants.length === 2){
        taxID += nameConsonants.join("") + nameVowels[0];
    } else if((nameConsonants.length === 1) && (nameVowels.length === 2)){
        taxID += nameConsonants[0] + nameVowels.join("");
    } else if((nameConsonants.length === 1) && (nameVowels.length === 1)){
        taxID += nameConsonants[0] + nameVowels[0] + 'X';
    } else if(nameVowels.length === 2){
        taxID += nameVowels.join("") + 'X';
    } else {
        // taxID += "---";

        throw new Error("Invalid name.")
    }

    taxID += birthDate.getFullYear().toString().slice(-2);
    taxID += upperCaseMonthCharacters[birthDate.getMonth()];

    taxID += addZero(birthDate.getDate() + ((gender === Gender.Female) ? 40 : 0));
    taxID += comune.codice_belfiore;
    taxID += calculateTaxIDCheckCharacter(taxID);

    return taxID;
}

async function execFileAsync(file: string, args: Nullable<Maybe<string[]>>, callback: (stdout: string, stderr: string) => void): Promise<number> {
    return (new Promise((resolve, reject) => {
        const proc: cp.ChildProcess = cp.execFile(file, args, async (err, stdout, stderr) => {
            if(err !== null){
                reject(err);

                return;
            }

            await callback(stdout, stderr);

            resolve(proc.exitCode as number);
        });
    }));
}

export * from "./webfriendlyutils";
export {
    TextPosition,
    TextFocus,
    Gender,
    TextBar,
    Logger,
    makeTextBar,
    calculateTaxID,
    execFileAsync
};
