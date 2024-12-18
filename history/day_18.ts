import { Logger, Part, run, Type } from "../day_utils"
import { World2D } from "../map2d.utils";
import { PriorityQueue } from "../priority_queue";
import { generator } from "../utils";

enum Cell {
    STANDARD,
    FALLEN
}


function parse(lines: string[]): World2D.Pos[] {
    return lines.map(l => {
        const [x, y] = l.split(",").map(n => parseInt(n, 10))
        return { x, y }
    });
}

type World = World2D.Map2d<Cell>;

type State = {
    cost: number,
    pos: World2D.Pos
}
function findPath(w: World, isTest: boolean): number | undefined {
    const endingPos = isTest ? { x: 6, y: 6 } : { x: 70, y: 70 };
    const queue = new PriorityQueue<State>((s) =>
        s.cost + (endingPos.x - s.pos.x) + (endingPos.y - s.pos.y),
        true);

    queue.put({
        cost: 0,
        pos: {
            x: 0,
            y: 0
        }
    }, "0|0");

    while (queue.isNotEmpty()) {
        const curr = queue.pop()!;
        if (curr.item.pos.x === endingPos.x && curr.item.pos.y === endingPos.y) {
            return curr.item.cost;
        }

        for (const next of World2D.ALL_DIRECTIONS
            .map(dir => w.move_pos_with_cell(curr.item.pos, dir))) {
            if (next === undefined || next.cell === Cell.FALLEN) {
                continue;
            }
            queue.put({
                cost: curr.item.cost + 1,
                pos: next.pos
            }, `${next.pos.x}|${next.pos.y}`);
        }
    }
    return undefined;
}

function printMap(w: World, logger: Logger) {
    if (!logger.isdebug()) {
        return;
    }
    logger.debug(["Map", ...w.cells().map(l => l.map(c => c === Cell.FALLEN ? "#" : ".").join(""))])
}

function generateMap(data: World2D.Pos[], generated: number[]): World {
    const map = new World2D.Map2d(generated.map(y => generated.map(x => Cell.STANDARD)));
    data.forEach(pos =>
        map.set_cell(pos, Cell.FALLEN)
    );
    return map;
}

function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    const isTest = (type === Type.TEST);
    const size = isTest ? 7 : 71;
    const generated = [...generator(size)];

    if (part === Part.PART_1) {
        const map = generateMap(data.slice(0, isTest ? 12 : 1024), generated);
        printMap(map, logger);
        const result = findPath(map, isTest);
        logger.result(result, [22, 296])
    }
    else {
        let lastSuccessIndex = -1;
        let lastFailedIndex = data.length;
        let currIndex = Math.floor(data.length / 2);
        let nbLoop = 0;
        while (lastSuccessIndex !== lastFailedIndex - 1) {
            nbLoop++;
            const map = generateMap(data.slice(0, currIndex), generated);
            const pathSize = findPath(map, isTest);
            printMap(map, logger);

            if (pathSize !== undefined) {
                lastSuccessIndex = currIndex;
                currIndex += Math.floor((lastFailedIndex - currIndex) / 2);
            } else {
                lastFailedIndex = currIndex;
                currIndex -= Math.floor((currIndex - lastSuccessIndex) / 2);
            }
            if (currIndex === lastSuccessIndex) {
                currIndex++
            } else if (currIndex === lastFailedIndex) {
                currIndex--;
            }
        }
        logger.log("Nb Loops " + nbLoop);
        const foundPos = data[lastSuccessIndex]
        const result = `${foundPos.x},${foundPos.y}`;
        logger.result(result, ["6,1", "28,44"])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 * @see run javadoc
 */
run(18, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2], { debug: false })