import { Logger, Part, run, Type } from "../day_utils"
import { World2D } from "../map2d.utils";

type LETTERS = "X" | "M" | "A" | "S";

type Content = World2D.Map2d<LETTERS>;

function parse(lines: string[]): Content {
    return new World2D.Map2d(lines.map(l => l.split("") as LETTERS[]));
}

function findNext(content: Content, pos: World2D.Pos, dir: World2D.Dir[], next: LETTERS[]): number {
    if (next.length === 0) {
        return 1;
    }
    const nextPos = content.move_pos_many_with_cell(pos, dir);
    return nextPos?.cell === next[0] ? findNext(content, nextPos.pos, dir, next.slice(1)) : 0;
}

function countXmas(content: Content): number {
    let count = 0;
    content.apply_to_all(World2D.Dir.RIGHT, World2D.Dir.DOWN, (pos) => {
        if (content.cell(pos) === "X") {
            for (const dir of World2D.ALL_DIRECTIONS_WITH_DIAGS) {
                count += findNext(content, pos, dir, ["M", "A", "S"]);
            }
        }
    })
    return count;
}


function countCrossMas(content: Content): number {
    let count = 0;
    content.apply_to_all(World2D.Dir.RIGHT, World2D.Dir.DOWN, (pos) => {
        if (content.cell(pos) !== "A") {
            return;
        }
        const topLeft = content.move_pos_many_with_cell(pos, World2D.DIRECTIONS_TOP_LEFT);
        const topRight = content.move_pos_many_with_cell(pos, World2D.DIRECTIONS_TOP_RIGHT);
        const bottomLeft = content.move_pos_many_with_cell(pos, World2D.DIRECTIONS_BOTTOM_LEFT);
        const bottomRight = content.move_pos_many_with_cell(pos, World2D.DIRECTIONS_BOTTOM_RIGHT);
        const cross1 = topLeft?.cell === "M" && bottomRight?.cell === "S";
        const cross2 = bottomLeft?.cell === "M" && topRight?.cell === "S";
        const cross3 = bottomRight?.cell === "M" && topLeft?.cell === "S";
        const cross4 = topRight?.cell === "M" && bottomLeft?.cell === "S";

        const nbCross = [cross1, cross2, cross3, cross4].reduce((a, b) => a + (b ? 1 : 0), 0);
        if (nbCross > 1) {
            count += 1;
        }
    })
    return count;
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    if (part === Part.PART_1) {
        const result = countXmas(data);
        logger.result(result, [18, 2517])
    }
    else {
        const result = countCrossMas(data);
        logger.result(result, [9, 1960])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(4, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])