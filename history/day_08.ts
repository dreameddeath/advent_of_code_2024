import { Logger, Part, run, Type } from "../day_utils"
import { World2D } from "../map2d.utils";
import { ExtendedMap } from "../mapUtils";

interface Cell {
    antenaType?: string,
    antinode: Set<string>;
    antinodePart2: Set<string>;
}
interface World {
    perLetterMap: Map<string, World2D.Pos[]>;
    map: World2D.Map2d<Cell>
}

function parse(lines: string[]): World {
    const perLetterMap = new ExtendedMap<string, World2D.Pos[]>();
    const map = new World2D.Map2d(
        lines.map((l, y) => l.split("").map((c, x) => {
            if (c !== ".") {
                perLetterMap.apply(c, (a, c) => {
                    a.push({ x, y });
                    return a;
                }, () => [])
            }
            return {
                antinode: new Set(),
                antinodePart2: new Set(),
                antenaType: c !== "." ? c : undefined
            } satisfies Cell
        }))
    )
    return {
        perLetterMap,
        map
    };
}

function checkAntinodeAddForPos(w: World, a: string, pos: World2D.Pos, vec: World2D.Vec2d, found: [number, number]) {
    let isFirst = true;
    let currPos = pos;
    const applyPart2 = (cell: Cell | undefined) => {
        if (cell) {
            if (cell.antinodePart2.size === 0) {
                found[1] += 1;
            }
            cell.antinodePart2.add(a);
        }
    }
    applyPart2(w.map.cell_opt(currPos))
    while (true) {
        currPos = vec.move(currPos);
        const antinodeCell = w.map.cell_opt(currPos);
        if (!antinodeCell) {
            return;
        }
        if (isFirst) {
            if (antinodeCell.antinode.size === 0) {
                found[0] += 1;
            }
            antinodeCell.antinode.add(a);
            isFirst = false;
        }
        applyPart2(antinodeCell);
    }
}

function foundAntinodesForAntenna(w: World, a: string, listPos: World2D.Pos[], found: [number, number]) {

    for (const [index, firstPos] of listPos.entries()) {
        for (let otherIndex = index + 1; otherIndex < listPos.length; ++otherIndex) {
            const otherPos = listPos[otherIndex];
            const vec = new World2D.Vec2d(firstPos, otherPos);
            checkAntinodeAddForPos(w, a, firstPos, vec.invert(), found);
            checkAntinodeAddForPos(w, a, otherPos, vec, found);
        }
    }
}

function foundAntinodes(w: World): [number, number] {
    let found: [number, number] = [0, 0];
    for (const [a, listPos] of w.perLetterMap.entries()) {
        foundAntinodesForAntenna(w, a, listPos, found);
    }
    return found;
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    const result = foundAntinodes(data);
    logger.result(result, [14, 214, 34, 809]);
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(8, [Type.TEST, Type.RUN], puzzle, [Part.ALL])