import { Logger, Part, run, Type } from "../day_utils"
import { World2D } from "../map2d.utils";
import { PriorityQueue } from "../priority_queue";

enum Cell {
    EMPTY,
    WALL
}

interface World {
    map: World2D.Map2d<Cell>;
    start: World2D.Pos,
    end: World2D.Pos
}

function parse(lines: string[]): World {
    const start: World2D.Pos = { x: 0, y: 0 };
    const end: World2D.Pos = { x: 0, y: 0 };
    const map = new World2D.Map2d<Cell>(lines.map((l, y) => l.split("").map((c, x) => {
        if (c === "S") { start.x = x; start.y = y; }
        else if (c === "E") { end.x = x; end.y = y; }
        return (c === "#") ? Cell.WALL : Cell.EMPTY
    })));

    return {
        start,
        end,
        map
    }
}

interface State {
    pos: World2D.Pos,
    dir: World2D.Dir,
    cost: number,
    previous?: StateQueue
}
type StateQueue = State & { estimatedCost: number, path: string }

function cost_turn(w: World, s: State): number {
    const vecX = new World2D.Vec2d({ x: s.pos.x, y: w.end.y }, w.end);
    const vecY = new World2D.Vec2d({ x: w.end.x, y: s.pos.y }, w.end);
    const turnTypeY = vecX.delta_y === 0 ? World2D.TurnType.STRAIT : vecY.turn_type_dir(s.dir);
    const turnTypeX = vecX.delta_x === 0 ? World2D.TurnType.STRAIT : vecX.turn_type_dir(s.dir);
    if (turnTypeX === World2D.TurnType.OPPOSITE || turnTypeY === World2D.TurnType.OPPOSITE) {
        return 2000;
    }
    if (vecX.delta_x === 0 && turnTypeY === World2D.TurnType.STRAIT) {
        return 0;
    } else if (vecY.delta_y === 0 && turnTypeX === World2D.TurnType.STRAIT) {
        return 0;
    } else {
        return 1000;
    }
}

function calcKey(s: State): string {
    return s.pos.x + "#" + s.pos.y + "|" + s.dir;
}

function toStateQueue(s: State, w: World, isFork: boolean): StateQueue {
    const offset = Math.abs(w.end.x - s.pos.x) +
        Math.abs(w.end.y - s.pos.y);
    const estimatedCost = s.cost +
        offset
        + ((offset === 0) ? 0 : cost_turn(w, s));
    let path: string;
    if (!isFork || s.previous === undefined) {
        path = s.previous?.path ?? "";
    } else {
        path = s.previous.path + "#" + s.previous.pos.x + "|" + s.previous.pos.y + "|" + s.dir;
    }
    return { ...s, estimatedCost, path };
}

function putState(q: PriorityQueue<StateQueue>, s: StateQueue, w: World): number | undefined {
    return q.put(s, calcKey(s), (a, b) => a.path === b.path);
}

function isPrevious(s: State, dir: World2D.Dir): boolean {
    if (s.previous === undefined) {
        return false;
    }
    const previous = s.previous;
    if (previous.pos.x === s.pos.x && previous.pos.y === s.pos.y && previous.dir === dir) {
        return true;
    }
    return false;
}

function findNextStates(w: World, s: StateQueue): StateQueue[] {
    const result: State[] = [];
    const move = w.map.move_pos_with_cell(s.pos, s.dir);
    if (move?.cell === Cell.EMPTY) {
        result.push({
            cost: s.cost + 1,
            pos: move.pos,
            dir: s.dir,
            previous: s
        })
    }
    {
        const clockwiseDir = World2D.turn_dir(s.dir, World2D.TurnType.CLOCKWISE);
        const next = w.map.move_pos_with_cell(s.pos, clockwiseDir);
        if (next?.cell === Cell.EMPTY) {
            result.push({
                cost: s.cost + 1000 + 1,
                pos: next.pos,
                dir: clockwiseDir,
                previous: s
            });
        }
    }

    {
        const counterClockwiseDir = World2D.turn_dir(s.dir, World2D.TurnType.COUNTERCLOCK_WISE);
        const next = w.map.move_pos_with_cell(s.pos, counterClockwiseDir);
        if (next?.cell === Cell.EMPTY) {
            result.push({
                cost: s.cost + 1000 + 1,
                pos: next.pos,
                dir: counterClockwiseDir,
                previous: s
            })
        }
    }

    return result.map(s => toStateQueue(s, w, result.length > 1));
}

function findPath(w: World): [number, number] {
    const stack = new PriorityQueue<StateQueue>((s) => s.estimatedCost, true);
    putState(stack, toStateQueue({
        pos: w.start,
        dir: World2D.Dir.RIGHT,
        cost: 0
    }, w, false), w)
    const found: State[] = [];
    let foundCost: number | undefined = undefined;
    while (stack.isNotEmpty()) {
        const next = stack.pop()!;
        if (foundCost !== undefined && next.item.cost > foundCost) {
            continue;
        }
        if (next.item.pos.x === w.end.x && next.item.pos.y === w.end.y) {
            found.push(next.item);
            foundCost = next.item.cost;
        } else {
            const nextStates = findNextStates(w, next.item)
            for (const newState of nextStates) {
                if (foundCost === undefined || newState.cost <= foundCost) {
                    putState(stack, newState, w);
                }
            }
        }
    }

    const positions = new Set<string>();
    for (const state of found) {
        let currState: State | undefined = state;
        while (currState !== undefined) {
            positions.add(currState.pos.x + "|" + currState.pos.y);
            currState = currState.previous
        }
    }
    return [found[0].cost, positions.size];
}

function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    const result = findPath(data);
    logger.result(result, [11048, 104516, 64, 545])
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 * @see run javadoc
 */
run(16, [Type.TEST, Type.RUN], puzzle, [Part.ALL])