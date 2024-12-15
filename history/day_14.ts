import { off } from "process";
import { Logger, Part, run, Type } from "../day_utils"
import { World2D } from "../map2d.utils";
import { ExtendedMap } from "../mapUtils";
import { generator } from "../utils";
import { closeSync, createWriteStream, openSync, write, WriteStream, writeSync } from "fs";
import { getISODay } from "date-fns";

//p=7,6 v=-1,-3

const PARSER = /^p=(\d+),(\d+)\s+v=(-?\d+),(-?\d+)$/;


interface Robot {
    p: World2D.Pos,
    v: World2D.Vec2d,
}

interface World {
    map: World2D.Map2d<number>,
    robots: Robot[]
}

function parse(lines: string[]): Robot[] {
    return lines.map(l => {
        const match = l.match(PARSER)!;
        return {
            p: {
                x: parseInt(match[1], 10),
                y: parseInt(match[2], 10),
            },
            v: new World2D.Vec2d({ x: 0, y: 0 }, {
                x: parseInt(match[3], 10),
                y: parseInt(match[4], 10),
            }),
        } satisfies Robot
    });
}


function findLoop(r: Robot, world: World): number {
    const orig: World2D.Pos = { ...r.p };
    let curr = r.p;
    let result = 0;
    do {
        result++;
        curr = r.v.moveCyclic(curr, world.map.size());
    } while (orig.x !== curr.x || orig.y !== curr.y);
    return result;
}


function move(world: World) {
    for (const robot of world.robots) {
        world.map.apply_cell(robot.p, c => (c ?? 0) - 1);
        robot.p = robot.v.moveCyclic(robot.p, world.map.size());
        world.map.apply_cell(robot.p, c => (c ?? 0) + 1);
    }
    //print(robots, size, logger)
}

function print(world: World, logger: Logger) {
    logger.debug(["", ...world.map.cells().map(l => l.map(c => (c === 0) ? " " : ("" + c)).join(";"))]);
}

enum MatchState {
    InTree,
    Intermediate,
    Border,
    Failure
}
function calcNextState(world: World, state: MatchState, pos: World2D.Pos, fct: (p: World2D.Pos) => void): MatchState {
    fct(pos);
    const value = world.map.cell(pos);
    if (state === MatchState.InTree && value === 0) {
        return MatchState.Intermediate;
    } else if (state === MatchState.Intermediate && value === 1) {
        return MatchState.Border;
    }
    return state;
}
function findTreePotentialPlace(world: World, middle: Readonly<World2D.Pos>): { x: number, minY: number, width: number, height: number } | undefined {
    let leftPos = { ...middle };
    let rightPos = { ...middle };
    let leftMatchState = MatchState.InTree;
    let rightMatchState = MatchState.InTree;

    for (let offset = 0; offset < middle.x; ++offset) {
        if (leftMatchState !== MatchState.Border) {
            leftMatchState = calcNextState(world, leftMatchState, leftPos, pos => pos.x--);
        }
        if (rightMatchState !== MatchState.Border) {
            rightMatchState = calcNextState(world, rightMatchState, rightPos, pos => pos.x++);
        }
        if (leftMatchState === MatchState.Border && rightMatchState === MatchState.Border) {
            break;
        }
    }
    const width = (rightPos.x - leftPos.x) + 1;
    if (width === 1 || width % 2 === 0) {
        return undefined;
    }
    const middleX = leftPos.x + (width - 1) / 2;
    let upPos = { x: middleX, y: middle.y };
    let downPos = { ...upPos };
    let upMatchState = MatchState.InTree;
    let downMatchState = MatchState.InTree;

    for (let offset = 0; offset < middle.y; ++offset) {
        if (upMatchState !== MatchState.Border) {
            upMatchState = calcNextState(world, upMatchState, upPos, pos => pos.y--);
        }
        if (downMatchState !== MatchState.Border) {
            downMatchState = calcNextState(world, downMatchState, downPos, pos => pos.y++);
        }
    }

    const height = (downPos.y - upPos.y) + 1;
    if (height === 1 || height % 2 === 0) {
        return undefined;
    }
    return { x: middleX, minY: upPos.y, width, height };
}

function isMatchingChristmasTreeLine(world: World, middle: Readonly<World2D.Pos>, y: number, width: number): { state: MatchState, nbFilled: number } {
    let horizontalState: MatchState = MatchState.InTree;
    let leftPos = { x: middle.x, y };
    let rightPos = { x: middle.x, y };
    let nbFilled = 0;
    if (world.map.cell(leftPos) === 1) {
        nbFilled++;
    }
    let offset = 1;
    const maxOffset = (width - 1) / 2;
    for (; offset <= maxOffset; ++offset) {
        leftPos.x--;
        rightPos.x++;
        const currValue = world.map.cell_opt(leftPos);
        if (currValue === undefined || currValue !== world.map.cell_opt(rightPos)) {
            return { state: MatchState.Failure, nbFilled: 0 };
        }
        if (currValue === 1) {
            nbFilled += 2;
        }
        if (currValue === 0 && horizontalState === MatchState.InTree) {
            horizontalState = MatchState.Intermediate;
        }
        if (currValue === 1 && horizontalState === MatchState.Intermediate) {
            horizontalState = MatchState.Border;
            break;
        }
    }
    return { state: horizontalState, nbFilled }
}

function isMatchingChristmasTree(world: World, origMiddle: Readonly<World2D.Pos>): boolean {
    if (world.map.cell(origMiddle) !== 1) {
        return false;
    }
    const placeInfo = findTreePotentialPlace(world, origMiddle);
    if (placeInfo === undefined) {
        return false;
    }

    const middle = { x: placeInfo.x, y: placeInfo.minY };
    for (let offset = 0; offset < placeInfo.height; ++offset) {
        const check = isMatchingChristmasTreeLine(world, middle, placeInfo.minY + offset, placeInfo.width);
        if (check.state === MatchState.Failure) {
            return false;
        }
        if ((offset === 0 || offset === (placeInfo.height - 1)) && check.nbFilled !== placeInfo.width) {
            return false;
        }
    }
    return true;
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const robots = parse(lines);
    const isTest = (type === Type.TEST);

    const SIZE = {
        width: isTest ? 11 : 101,
        height: isTest ? 7 : 103
    } as const;

    const map = new World2D.Map2d<number>([...generator(SIZE.height)].map(y => [...generator(SIZE.width)].map(x => 0)));
    robots.forEach(r => map.apply_cell(r.p, (c) => (c ?? 0) + 1));
    const world: World = { map, robots };
    const MIDDLE = {
        x: Math.floor((SIZE.width - 1) / 2),
        y: Math.floor((SIZE.height - 1) / 2)
    };
    const loopSize = findLoop(robots[0], world);
    if (logger.isdebug()) {
        const r = robots.findIndex(r => findLoop(r, world) !== loopSize);
        if (r >= 0) {
            throw new Error("Bad data set");
        }
    }

    const quadrants = [0, 0, 0, 0];
    let foundPos = -1;
    [...generator(Math.max(100, loopSize))].forEach((i) => {
        move(world);
        if (isMatchingChristmasTree(world, MIDDLE)) {
            print(world, logger);
            foundPos = i + 1;
        }
        if (i === 100 - 1) {
            robots.forEach(robot => {
                if (robot.p.x === MIDDLE.x || robot.p.y === MIDDLE.y) {
                    return;
                }
                const offsetX = robot.p.x < MIDDLE.x ? 0 : 2;
                const offsetY = robot.p.y < MIDDLE.y ? 0 : 1;
                quadrants[offsetX + offsetY]++;
            })
        }
    });
    const result: [number | undefined, number | undefined] = [quadrants.reduce((a, b) => a * b), foundPos];
    logger.result(result, [12, 215476074, -1, 6285])

}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 * @see run javadoc
 */
run(14, [Type.TEST, Type.RUN], puzzle, [Part.ALL], { debug: false })