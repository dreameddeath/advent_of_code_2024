import { Logger, Part, run, Type } from "./day_utils"
import { FrequencyMap } from "./frequencyMap";

function parse(lines: string[]): [number[], number[]] {
    const result: [number[], number[]] = [[], []];
    return lines.map(l =>
        l.split(/\s+/).map(part => parseInt(part, 10)))
        .reduce((all, tuple) => {
            all[0].push(tuple[0]);
            all[1].push(tuple[1]);
            return all
        }, result);
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    if (part === Part.PART_1) {
        data[0].sortIntuitive();
        data[1].sortIntuitive();

        const result = data[0]
            .map(
                (val, pos) => Math.abs(val - data[1][pos]))
            .reduce((a, b) => a + b);
        logger.result(result, [11, 1579939])
    }
    else {
        const rightMap = new FrequencyMap();
        data[1].forEach(v => rightMap.add(v));

        const result = data[0].map(v => v * rightMap.get(v)).reduce((a, b) => a + b);
        logger.result(result, [31, 20351745])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(1, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])