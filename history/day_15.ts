import { Logger, Part, run, Type } from "../day_utils"
import { World2D } from "../map2d.utils";
import { PackMatchAction } from "../utils";

interface Puzzle {
    map: World2D.Map2d<Cell>,
    start: World2D.Pos,
    directions: World2D.Dir[]
}

enum Cell {
    WALL = "#",
    EMPTY = ".",
    BOX = "O",
    ROBOT = "@",
    LEFT_BOX = "[",
    RIGHT_BOX = "]"
}

function parse(lines: string[]): Puzzle {
    const [puzzle, rules] = lines.packIf(l => l.trim().length === 0, PackMatchAction.SKIP_AND_CHANGE);
    const start: World2D.Pos = { x: 0, y: 0 };
    const map = new World2D.Map2d<Cell>(puzzle.map((l, y) => l.split("").map((c, x) => {
        if (c === Cell.ROBOT) {
            start.x = x;
            start.y = y;
            return Cell.EMPTY;
        }
        return c as Cell
    })));
    const directions = rules.flatMap(l => l.split("").map(a => {
        switch (a) {
            case "^": return World2D.Dir.UP;
            case "v": return World2D.Dir.DOWN;
            case "<": return World2D.Dir.LEFT;
            case ">": return World2D.Dir.RIGHT;
            default: throw new Error("Bad dir " + a);
        }
    }));
    return {
        map,
        start,
        directions
    };
}

function canApplyAction(dir: World2D.Dir, pos: World2D.Pos, puzzle: Puzzle): boolean {
    const next = puzzle.map.move_pos_with_cell(pos, dir);
    if (next === undefined || next.cell === Cell.WALL) {
        return false;
    } else if (next.cell === Cell.EMPTY) {
        return true;
    }
    if (next.cell === Cell.BOX || dir === World2D.Dir.LEFT || dir === World2D.Dir.RIGHT) {
        return canApplyAction(dir, next.pos, puzzle);
    }
    if (next.cell === Cell.LEFT_BOX) {
        return canApplyAction(dir, next.pos, puzzle) && canApplyAction(dir, World2D.move_pos(next.pos, World2D.Dir.RIGHT), puzzle);
    } else {
        return canApplyAction(dir, next.pos, puzzle) && canApplyAction(dir, World2D.move_pos(next.pos, World2D.Dir.LEFT), puzzle);
    }
}

function doApplyAction(dir: World2D.Dir, pos: World2D.Pos, puzzle: Puzzle): void {
    const next = puzzle.map.move_pos_with_cell(pos, dir);
    if (next === undefined || next.cell === Cell.WALL || next.cell == Cell.EMPTY) {
        return;
    }

    const result = [next.pos];
    doApplyAction(dir, next.pos, puzzle);
    puzzle.map.set_cell(World2D.move_pos(next.pos, dir), next.cell);
    puzzle.map.set_cell(next.pos, Cell.EMPTY);

    if ((dir === World2D.Dir.UP || dir === World2D.Dir.DOWN) && next.cell !== Cell.BOX) {
        const otherPos = World2D.move_pos(next.pos, (next.cell === Cell.LEFT_BOX) ? World2D.Dir.RIGHT : World2D.Dir.LEFT);
        doApplyAction(dir, otherPos, puzzle);
        puzzle.map.set_cell(World2D.move_pos(otherPos, dir), puzzle.map.cell(otherPos)!);
        puzzle.map.set_cell(otherPos, Cell.EMPTY);
        result.push(otherPos);
    }
}

function toString(robot: World2D.Pos, puzzle: Puzzle): string {
    return puzzle.map.cells().map((l, y) => l.map((c, x) => {
        if (x === robot.x && y === robot.y) {
            return Cell.ROBOT;
        } else {
            return c
        }
    }).join("")).join("\n")
}

function print(index: number, robot: World2D.Pos, puzzle: Puzzle, logger: Logger): void {
    if (!logger.isdebug()) {
        return
    }

    logger.debug(`Pos ${index}\n` + toString(robot, puzzle));
}

function applyActions(puzzle: Puzzle, logger: Logger, isPart2: boolean) {
    let curr = { ...puzzle.start };
    print(-1, curr, puzzle, logger)
    for (const [i, dir] of puzzle.directions.entries()) {
        if (canApplyAction(dir, curr, puzzle)) {
            doApplyAction(dir, curr, puzzle);
            curr = World2D.move_pos(curr, dir);
        }
        print(i, curr, puzzle, logger)
    }
}

function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    const isPart2 = part === Part.PART_2;
    if (isPart2) {
        data.map = new World2D.Map2d<Cell>(
            data.map.cells().map(l => l
                .flatMap(c => {
                    if (c === Cell.BOX) {
                        return ["[", "]"] as Cell[];
                    } else {
                        return [c, c]
                    }
                }))
        );
        data.start.x *= 2;
    }
    applyActions(data, logger, isPart2);
    const result = data.map.cells()
        .flatMap(
            (l, y) => l.map(
                (c, x) => {
                    if (c !== Cell.BOX && c !== Cell.LEFT_BOX) {
                        return 0;
                    }
                    return (100 * y) + x;
                }
            )
        )
        .reduce((a, b) => a + b);
    if (!isPart2) {
        logger.result(result, [10092, 1412971])
    }
    else {
        logger.result(result, [9021, 1429299])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 * @see run javadoc
 */
run(15, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2], { debug: false })