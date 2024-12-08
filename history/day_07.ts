import { Logger, Part, run, Type } from "../day_utils"
import { ParallelContext } from "../parallel_utils";
interface Expr {
    testValue: number,
    values: number[]
}

function parse(lines: string[]): Expr[] {
    return lines.map(l => {
        const [expectedStr, valuesStr] = l.split(": ");
        const testValue = parseInt(expectedStr, 10);
        if ((testValue + "") !== expectedStr) {
            throw new Error("Too big");
        }
        return {
            testValue: parseInt(expectedStr, 10),
            values: valuesStr.split(/\s+/).map(n => parseInt(n, 10))
        }
    });
}



declare global {
    function trySolve(expr: Expr, currPos: number, currTotal: number, isPart2: boolean): boolean;
}

global.trySolve = (expr: Expr, currPos: number, currTotal: number, isPart2: boolean): boolean => {
    if (currTotal > expr.testValue) {
        return false;
    }
    if (currPos === expr.values.length) {
        return (currTotal === expr.testValue);
    }
    const currNumber = expr.values[currPos];
    const trySolvePlus = trySolve(expr, currPos + 1, currTotal + currNumber, isPart2);
    if (trySolvePlus) {
        return trySolvePlus;
    }
    const trySolveMul = trySolve(expr, currPos + 1, currTotal * currNumber, isPart2);
    if (!isPart2 || trySolveMul) {
        return trySolveMul;
    }
    const shift = Math.floor(Math.log10(currNumber)) + 1;
    const concat = (currTotal * (10 ** shift)) + currNumber;
    return trySolve(expr, currPos + 1, concat, isPart2);
}
async function puzzle(lines: string[], part: Part, type: Type, logger: Logger): Promise<void> {
    const data = parse(lines);
    const parallel = new ParallelContext();
    const isPart2 = part === Part.PART_2;
    const parallelRes = await parallel.applyParallel(data,
        (subArray) => {
            const result = subArray
                .filter(expr => trySolve(expr, 1, expr.values[0], isPart2))
                .reduce<number>((t, expr) => t + expr.testValue, 0);
            return result;
        },
        { isPart2: isPart2 }
    )
    const result = parallelRes.reduce((a, b) => a + b);
    if (part === Part.PART_1) {
        logger.result(result, [3749, 303766880536])
    }
    else {
        logger.result(result, [11387, 337041851384440])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(7, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2], { multithread: true })