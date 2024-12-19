import { Logger, Part, run, Type } from "../day_utils"
import { ExtendedMap } from "../mapUtils";

type Remaining = ExtendedMap<number, string[]>;

interface Dataset {
    patterns: string[],
    mapPerRemaining: Remaining,
    designs: string[]
}

function parse(lines: string[]): Dataset {
    const patterns = lines[0]!.split(", ");
    patterns.reverseSortIntuitive(p => p.length);
    const designs = lines.slice(2);
    const maxLength = designs.reduce((max, current) => Math.max(max, current.length), 0);
    const mapPerRemaining = new ExtendedMap<number, string[]>();
    patterns.forEach(p => {
        for (let remaining = p.length; remaining <= maxLength; ++remaining) {
            mapPerRemaining.apply(remaining, (l) => {
                l.push(p);
                return l;
            }, () => []);
        }
    })
    return {
        patterns,
        mapPerRemaining,
        designs: lines.slice(2)
    };
}



function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    const result = data.designs.map((design) => matchV3(design, data.mapPerRemaining));
    const part1 = result.filter(r => r > 0).length;
    const part2 = result.reduce((a, b) => a + b);
    logger.result([part1, part2], [6, 369, 16, 761826581538190])

}


function matchNext(design: string, mapPerRemaining: Remaining, pos: number, foundPerPos: ExtendedMap<number, number>): number {
    const found = foundPerPos.get(pos)
    if (found !== undefined) {
        return found;
    }
    const remaining = design.substring(pos);
    if (remaining.length === 0) {
        return 1;
    }
    const potential = mapPerRemaining.get(remaining.length);
    let nbFound = 0;
    if (potential) {
        for (const pattern of potential) {
            if (remaining.startsWith(pattern)) {
                nbFound += matchNext(design, mapPerRemaining, pos + pattern.length, foundPerPos);
            }
        }
    }
    foundPerPos.set(pos, nbFound);
    return nbFound;
}

function matchV3(design: string, mapPerRemaining: Remaining): number {
    const foundPerPos = new ExtendedMap<number, number>();
    return matchNext(design, mapPerRemaining, 0, foundPerPos);
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 * @see run javadoc
 */
run(19, [Type.TEST, Type.RUN], puzzle, [Part.ALL])