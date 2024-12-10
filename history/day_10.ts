import { Logger, Part, run, Type } from "../day_utils"
import { World2D } from "../map2d.utils";

type World = World2D.Map2d<number>;
function parse(lines: string[]): World {
    return new World2D.Map2d(lines.map(l => l.split("").map(h => {
        if (h === ".") { return -1 }
        return parseInt(h, 10)
    })));
}


function find_trailhead_score(w: World, curr_pos: World2D.Pos, currNumber: number, startPos: World2D.Pos, seen: Set<string>): number {
    let result = 0;
    const next = currNumber + 1;
    for (const { pos, cell } of w.move_all_direction_with_cell(curr_pos, false)) {
        if (cell !== next) {
            continue;
        }
        if (cell === 9) {
            const key = pos.x + '|' + pos.y;
            seen.add(key)
            result += 1;
        } else {
            result += find_trailhead_score(w, pos, next, startPos, seen);
        }
    }
    return result;
}


function find_all_trailheads(w: World): [number, number] {
    let totalScore: [number, number] = [0, 0];
    w.apply_to_all(World2D.Dir.RIGHT, World2D.Dir.DOWN, pos => {
        if (w.cell(pos) === 0) {
            const foundNodes = new Set<string>()
            const score = find_trailhead_score(w, pos, 0, pos, foundNodes);
            totalScore[0] += foundNodes.size;
            totalScore[1] += score;
        }
    })
    return totalScore
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    const result = find_all_trailheads(data);
    logger.result(result, [36, 794, 81, 1706]);
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 * @see run javadoc
 */
run(10, [Type.TEST, Type.RUN], puzzle, [Part.ALL])