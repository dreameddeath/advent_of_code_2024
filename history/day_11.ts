import { Logger, Part, run, Type } from "../day_utils"
import { ExtendedMap } from "../mapUtils";
import { generator } from "../utils";

function parse(lines: string[]): number[] {
    return lines[0].split(/\s+/).map(n => parseInt(n, 10));
}

type Corridor = ExtendedMap<number, number>;

function blink(before: Corridor): Corridor {
    const afterBlink: Corridor = new ExtendedMap();
    const addToMap = (n: number, q: number) => afterBlink.apply(n, (c) => c + q, () => 0);
    for (const [n, q] of before.entries()) {
        if (n === 0) {
            addToMap(1, q);
        } else {
            const nbDigits = Math.floor(Math.log10(n)) + 1;
            if ((nbDigits & 1) === 0) {
                const divider = 10 ** (nbDigits >> 1);
                addToMap(Math.floor(n / divider), q);
                addToMap(n % divider, q);
            } else {
                addToMap(n * 2024, q)
            }
        }
    }
    return afterBlink;
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    const corridor: Corridor = new ExtendedMap();
    data.forEach(n => corridor.apply(n, (c) => c + 1, () => 0));
    const resultAfter25 = [...generator(25)].reduce((n) => blink(n), corridor);
    const resultAfter75 = [...generator(50)].reduce((n) => blink(n), resultAfter25);
    const part1 = [...resultAfter25.values()].reduce((a, b) => a + b);
    const part2 = [...resultAfter75.values()].reduce((a, b) => a + b);
    logger.result([part1, part2], [55312, 213625, 65601038650482, 252442982856820])
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 * @see run javadoc
 */
run(11, [Type.TEST, Type.RUN], puzzle, [Part.ALL])