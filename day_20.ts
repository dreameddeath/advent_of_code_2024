import { Logger, Part, run, Type } from "./day_utils"
import { World2D } from "./map2d.utils";
import { ExtendedMap } from "./mapUtils";
import { PriorityQueue } from "./priority_queue";

enum Cell {
    WALL = 0,
    EMPTY = 1,
    EXPLORED = 2
}

enum CellPrintable {
    WALL = "#",
    EMPTY = ".",
    USED = "o",
    CHEAT = "c"
}

interface World {
    map: World2D.Map2d<Cell>,
    start: World2D.Pos,
    end: World2D.Pos
}

function parse(lines: string[]): World {
    const start: World2D.Pos = { x: 0, y: 0 };
    const end: World2D.Pos = { x: 0, y: 0 };

    const map = new World2D.Map2d(lines.map((l, y) => l.split("").map((c, x) => {
        if (c === "E") {
            end.x = x;
            end.y = y;
            return Cell.EMPTY
        } else if (c === "S") {
            start.x = x;
            start.y = y;
            return Cell.EMPTY;
        }
        return c === "#" ? Cell.WALL : Cell.EMPTY;
    })));

    return {
        map,
        start,
        end
    };
}

const keyFct = (p: World2D.Pos) => `${p.x}|${p.y}`;
interface State {
    cost: number,
    pos: World2D.Pos,
    previousState?: State,
}
type CalcStateCost = (s: State) => number;
function nextStates(w: World, s: State, forCheat?: boolean,): State[] {
    const nextPositions: World2D.PosAndCell<Cell>[] = World2D.ALL_DIRECTIONS.mapNonNull(dir => w.map.move_pos_with_cell(s.pos, dir));
    const result: State[] = [];
    for (const nextPosition of nextPositions) {
        if (nextPosition.cell === Cell.EMPTY || (forCheat && nextPosition.cell === Cell.WALL)) {
            result.push({
                cost: s.cost + 1,
                pos: nextPosition.pos,
                previousState: s
            });

        }
    }
    return result;
}

function print(w: World, logger: Logger, state: State) {
    if (!logger.isdebug()) {
        return;
    }
    const map = new World2D.Map2d<CellPrintable>(w.map.cells().map(l => l.map(c => c === Cell.EMPTY ? CellPrintable.EMPTY : CellPrintable.WALL)));
    let currState: State | undefined = state;
    while (currState !== undefined) {
        map.set_cell(currState.pos, CellPrintable.USED);
        currState = currState.previousState;
    }
    logger.debug(["Map", ...map.cells().map(l => l.join(""))])
}

function solveForStartState(w: World, startState: State, logger: Logger): [number, State] | undefined {
    const calcMinStateCost: CalcStateCost = (s) => s.cost + Math.abs(s.pos.x - w.end.x) + Math.abs(s.pos.y - w.end.y);

    const queue = new PriorityQueue<State>(s => calcMinStateCost(s), true);

    queue.put(startState);
    while (queue.isNotEmpty()) {
        const curr = queue.pop()!.item;
        if (curr.pos.x === w.end.x && curr.pos.y === w.end.y) {
            print(w, logger, curr);
            return [curr.cost, curr];
        }
        const nexts = nextStates(w, curr);
        for (const next of nexts) {
            queue.put(next, keyFct(next.pos));
        }
    }
    return undefined;
}

interface CheatState {
    paths: State[],
    pathsKeys: string[]
}

function findCheats(w: World, baseState: State, maxCheatDuration: number): State[] {
    const states: State[] = [];
    const startPos = baseState.pos;
    const maxOffset = maxCheatDuration;
    for (let y = baseState.pos.y - maxOffset; y <= baseState.pos.y + maxOffset; ++y) {
        for (let x = baseState.pos.x - maxOffset; x <= baseState.pos.x + maxOffset; ++x) {
            const pos = { x, y };
            const distance = Math.abs(x - startPos.x) + Math.abs(y - startPos.y);
            if (distance > maxCheatDuration) {
                continue;
            }
            const cell = w.map.cell_opt(pos);
            if (cell === Cell.EMPTY) {
                states.push({
                    cost: baseState.cost + distance,
                    pos,
                    previousState: baseState
                })
            }
        }
    }
    return states;
}

function solve(w: World, minSaveTime: number, maxCheatDuration: number, logger: Logger): [number, number] {
    const nbEmpty = w.map.cells().map(l => l.filter(c => c === Cell.EMPTY).length).reduce((a, b) => a + b);
    const [baseline, state] = solveForStartState(w, {
        cost: 0,
        pos: w.start
    }, logger)!;
    const baselineOptimal: State[] = [];
    let currState: State | undefined = state;
    let stateByPos = new ExtendedMap<string, State>();
    while (currState != undefined) {
        baselineOptimal.push(currState);
        stateByPos.set(keyFct(currState.pos), currState);
        currState = currState.previousState;
    }
    baselineOptimal.reverse();
    if (nbEmpty !== baselineOptimal.length) {
        throw new Error("E");
    }
    let nbCheatFound = 0;
    let nbCheatEvalutated = 0;
    const foundPerDuration = new ExtendedMap<number, string[]>();
    const startCellExplored = new Set<string>();
    const cheatExplored = new Set<string>();
    for (const refState of baselineOptimal) {
        w.map.set_cell(refState.pos, Cell.EXPLORED);
        /*const startExploreCell = nextStates(w, refState, true).filter(s => w.map.cell(s.pos) === Cell.WALL);
        for (const startState of startExploreCell) {
            const key = keyFct(startState.pos);
            if (startCellExplored.has(key)) { continue; }
            startCellExplored.add(key);*/
            for (const cheatStartState of findCheats(w, refState, maxCheatDuration)) {
                const cheatKey = keyFct(refState.pos) + "#" + keyFct(cheatStartState.pos);
                if (cheatExplored.has(cheatKey)) {
                    continue;
                }
                cheatExplored.add(cheatKey)
                nbCheatEvalutated++;
                const baselineState = stateByPos.get(keyFct(cheatStartState.pos));
                if (baselineState === undefined) {
                    continue;
                }
                const gain = baselineState.cost - cheatStartState.cost;
                if (gain < 0) {
                    continue;
                }
                if (gain >= minSaveTime) {
                    foundPerDuration.apply(gain, (l) => {
                        l.push(keyFct(refState.pos) + "#" + keyFct(cheatStartState.pos));
                        return l
                    }, () => []);
                    nbCheatFound++
                }
            }
        /*}*/
    }
    return [baseline, nbCheatFound];
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    const isTest = type === Type.TEST;
    if (part === Part.PART_1) {
        const result = solve(data, isTest ? 1 : 100, 2, logger);
        logger.result(result[1], [44, 1502])
    }
    else {
        const result = solve(data, isTest ? 50 : 100, 20, logger);
        logger.result(result[1], [285, undefined])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 * @see run javadoc
 */
run(20, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2], { debug: false })