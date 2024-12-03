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

interface State {
    enabled: boolean,
    total: number;
}

function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    const result = data.filterTyped<TokenMul>(t => t.type === TokenType.MUL).reduce((s, t) => s + t.a * t.b, 0);
    const resultPart2 = data.reduce<State>((state, token) => {
        return {
            enabled: (token.type === TokenType.DO || state.enabled) && token.type !== TokenType.DONT,
            total: state.total + (token.type === TokenType.MUL && state.enabled ? token.a * token.b : 0)
        }
    }, { enabled: true, total: 0 });
    logger.result([result, resultPart2.total], [161, 168539636, 48, 97529391])

}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(3, [Type.TEST, Type.RUN], puzzle, [Part.ALL])