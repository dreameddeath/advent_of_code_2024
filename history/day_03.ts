import { Logger, Part, run, Type } from "../day_utils"

const REGEXP = /(?:do|don't)\(\)|mul\((\d+),(\d+)\)/g;
enum TokenType {
    DO,
    DONT,
    MUL
}
type TokenMul = { type: TokenType.MUL, a: number, b: number };
type Token = { type: TokenType.DO | TokenType.DONT } | TokenMul;


function parse(lines: string[]): Token[] {
    return lines.flatMap(l =>
        [...(l.matchAll(REGEXP) ?? [])]
            .map<Token>((t) => {
                if (t[0].startsWith("don't")) {
                    return { type: TokenType.DONT }
                } else if (t[0].startsWith("do")) {
                    return { type: TokenType.DO }
                } else {
                    return { type: TokenType.MUL, a: parseInt(t[1], 10), b: parseInt(t[2], 10) };
                }
            })
    );
}

function doMul(m: string): number {
    const res = m.match(/mul\((\d+),(\d+)\)/);
    if (!res) {
        return 0;
    }
    return parseInt(res[1], 10) * parseInt(res[2], 10);
}

function doCalc(m: Token[]): number {
    let res = 0;
    let enabled = true;
    for (const current of m) {
        if (current.type === TokenType.DONT) {
            enabled = false;
        } else if (current.type === TokenType.DO) {
            enabled = true;
        } else if (enabled && current.type === TokenType.MUL) {
            res += current.a * current.b;
        }
    }
    return res;
}

function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    const result = data.filterTyped<TokenMul>(t => t.type === TokenType.MUL).reduce((s, t) => s + t.a * t.b, 0);
    const resultPart2 = doCalc(data);
    logger.result([result, resultPart2], [161, 168539636, 48, 97529391])

}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(3, [Type.TEST, Type.RUN], puzzle, [Part.ALL])