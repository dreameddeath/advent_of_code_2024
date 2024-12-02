import { Logger, Part, run, Type } from "../day_utils"

function parse(lines: string[]): number[][] {
    return lines.filter(l => l && l.trim().length > 0).map(l => l.split(" ").map(n => parseInt(n, 10)));
}


function isSafeV2(list: number[], allowError: boolean, posToIgnore: number = -1): boolean {
    let lastValidPos = posToIgnore === 0 ? 1 : 0;
    const firstPossible = posToIgnore===(lastValidPos+1)?(lastValidPos+2):(lastValidPos+1);
    const diffStart = list[firstPossible] - list[lastValidPos];
    for (let pos = firstPossible; pos < list.length; ++pos) {
        if (posToIgnore === pos) { continue; }
        const previous = list[lastValidPos];
        const diff = list[pos] - previous;
        const diffAbs = Math.abs(diff);
        const isValid = (diffStart * diff > 0) && diffAbs >= 1 && diffAbs <= 3;
        if (isValid) {
            lastValidPos = pos;
        } else if (!allowError) {
            return false;
        } else {
            for (const offset of [-2, -1, 0]) {
                const posToIgnore = offset + pos;
                if (posToIgnore < 0) { continue; }
                if (isSafeV2(list, false, posToIgnore)) {
                    return true;
                }
            }
            return false;
        }
    }
    return true;
}

function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    if (part === Part.PART_1) {
        const result = data.filter(l => isSafeV2(l, false));
        logger.result(result.length, [2, 379])
    }
    else {
        const result = data.filter(l => isSafeV2(l, true));
        logger.result(result.length, [4, 430])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(2, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])