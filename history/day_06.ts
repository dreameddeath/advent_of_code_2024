import { Logger, Part, run, Type } from "../day_utils"
import { World2D } from "../map2d.utils";
import { generator } from "../utils";

enum CellType {
    EMPTY = ".",
    WALL = "#",
    UP = "^",
    DOWN = "D",
    LEFT = "<",
    RIGHT = ">"
}

type NextWallMap = Map<World2D.Dir, World2D.Pos>;

type CellNotWall = { curr: Set<CellType>/*, simulationPerBlock: Map<string, Set<CellType>>*/, wallMap: NextWallMap };

type Cell = CellType.WALL | CellNotWall;

type MapWorld = {
    map: World2D.Map2d<Cell>,
    start: World2D.Pos
}

type CacheWallToUpdate = [number, CellNotWall[]];
function parse(lines: string[]): MapWorld {
    const start: World2D.Pos = { x: 0, y: 0 };
    const lastWallAbovePerX = new Map<number, CacheWallToUpdate>();
    [...generator(lines[0].length)].forEach(x => lastWallAbovePerX.set(x, [-1, []]));
    const map = new World2D.Map2d(lines.map(
        (l, y) => {
            let lastWallOnLeft: CacheWallToUpdate = [-1, []];
            return l.split("").map<Cell>((c, x) => {
                if (c === CellType.WALL) {
                    const aboveWall = lastWallAbovePerX.get(x);

                    if (aboveWall) {
                        const pos = { x, y: y - 1 };
                        aboveWall[1].forEach(cell => cell.wallMap.set(World2D.Dir.DOWN, pos));
                    }
                    if (lastWallOnLeft) {
                        const pos = { x: x - 1, y };
                        lastWallOnLeft[1].forEach(cell => cell.wallMap.set(World2D.Dir.RIGHT, pos))
                    }
                    lastWallAbovePerX.set(x, [y, []]);
                    lastWallOnLeft = [x, []];
                    return CellType.WALL
                }
                const currCell = new Set<CellType>();
                if (c !== CellType.EMPTY) {
                    start.x = x;
                    start.y = y;
                    currCell.add(CellType.UP);
                }
                const wallMap: NextWallMap = new Map();
                const newCell = { curr: currCell, simulationPerBlock: new Map(), wallMap };
                const aboveWall = lastWallAbovePerX.get(x)!;

                if (aboveWall[0] >= 0) {
                    wallMap.set(World2D.Dir.UP, { x, y: aboveWall[0] + 1 });
                }
                aboveWall[1].push(newCell);
                if (lastWallOnLeft[0] >= 0) {
                    wallMap.set(World2D.Dir.LEFT, { x: lastWallOnLeft[0] + 1, y });
                }
                lastWallOnLeft[1].push(newCell)

                return newCell;
            })
        }));
    return {
        map,
        start,

    }
}

function mapDir(dir: World2D.Dir): CellType {
    switch (dir) {
        case World2D.Dir.UP: return CellType.UP;
        case World2D.Dir.DOWN: return CellType.DOWN;
        case World2D.Dir.LEFT: return CellType.LEFT;
        case World2D.Dir.RIGHT: return CellType.RIGHT;
    }
}

function checkCycleOrAddVirtual(cellPos: World2D.Pos, currDirCell: CellType, visitedDuringCheck: Set<string>): boolean {
    const fullKey = cellPos.x + "|" + cellPos.y + "|" + currDirCell;
    if(visitedDuringCheck.has(fullKey)){
        return true;
    }
    visitedDuringCheck.add(fullKey);
    return false;
}

function isObstacleReachable(currPos: World2D.Pos, posObstacle: World2D.Pos, currDir: World2D.Dir): boolean {
    switch (currDir) {
        case World2D.Dir.LEFT: return currPos.y === posObstacle.y && currPos.x > posObstacle.x;
        case World2D.Dir.RIGHT: return currPos.y === posObstacle.y && currPos.x < posObstacle.x;
        case World2D.Dir.UP: return currPos.x === posObstacle.x && currPos.y > posObstacle.y;
        case World2D.Dir.DOWN: return currPos.x === posObstacle.x && currPos.y < posObstacle.y;
    }
}

function nextOptimalPos(currCell: CellNotWall, currPos: World2D.Pos, posObstacle: World2D.Pos, currDir: World2D.Dir): World2D.Pos | undefined {
    const obstacleReachable = isObstacleReachable(currPos, posObstacle, currDir);
    const nextCellBeforeWall = currCell.wallMap.get(currDir);
    if (!obstacleReachable && !nextCellBeforeWall) {
        return undefined;
    }
    if (!obstacleReachable) {
        return nextCellBeforeWall;
    }
    const posBeforeObstacle = World2D.move_pos(posObstacle, World2D.oppositeDir(currDir));
    if (!nextCellBeforeWall) {
        return posBeforeObstacle;
    }
    const distObstacble = Math.abs(posBeforeObstacle.y - currPos.y) + Math.abs(posBeforeObstacle.x - currPos.x);
    const distNextWall = Math.abs(nextCellBeforeWall.y - currPos.y) + Math.abs(nextCellBeforeWall.x - currPos.x);
    if (distObstacble < distNextWall) {
        return posBeforeObstacle
    } else {
        return nextCellBeforeWall;
    }
}

function checkCycles(w: MapWorld, cell: CellNotWall, s: World2D.Pos, dirBeforeObstacle: World2D.Dir): boolean {
    const visitedDuringCheck = new Set<string>();
    const posObstacleWithCell = w.map.move_pos_with_cell(s, dirBeforeObstacle);
    if (posObstacleWithCell === undefined || posObstacleWithCell.cell === CellType.WALL || posObstacleWithCell.cell.curr.size > 0) {
        return false;
    }

    let currDir = World2D.turn_dir(dirBeforeObstacle, World2D.TurnType.CLOCKWISE);
    let currPos = s;
    let currDirCell = mapDir(currDir);
    let currCell = cell;
    let isFirst = true;
    while (true) {
        if (!isFirst && (currCell.curr.has(currDirCell) || checkCycleOrAddVirtual(currPos, currDirCell, visitedDuringCheck))) {
            return true;
        }
        isFirst = false;
        const nextPos = nextOptimalPos(currCell, currPos, posObstacleWithCell.pos, currDir);
        if (nextPos === undefined) {
            return false;
        }
        const nextCell = w.map.cell(nextPos)
        if (nextCell === undefined || nextCell === CellType.WALL) {
            throw new Error("Shouldn't occurs");
        }
        currPos = nextPos;
        currCell = nextCell;
        currDir = World2D.turn_dir(currDir, World2D.TurnType.CLOCKWISE);
        currDirCell = mapDir(currDir);
    }
}

function walkMap(w: MapWorld): [number, number] {
    let currPos = w.start;
    let nbUsed = 1;
    let currDir = World2D.Dir.UP;
    let currDirCell = mapDir(currDir);
    let currCell = w.map.cell(currPos) as CellNotWall;
    let nbFoundObstacles = 0;
    while (true) {
        if (currCell.curr.size === 0) {
            nbUsed++;
        }
        currCell.curr.add(currDirCell);
        if (checkCycles(w, currCell, currPos, currDir)) {
            nbFoundObstacles++;
        }
        const next = w.map.move_pos_with_cell(currPos, currDir);
        if (next === undefined) {
            break;
        }
        if (next.cell === CellType.WALL) {
            currDir = World2D.turn_dir(currDir, World2D.TurnType.CLOCKWISE);
            currDirCell = mapDir(currDir);
        } else {
            currCell = next.cell;
            currPos = next.pos;
        }
    }

    return [nbUsed, nbFoundObstacles];
}




function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    const result = walkMap(data);

    logger.result(result, [41, 4890, 6, 1995])

}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(6, [Type.TEST, Type.RUN], puzzle, [Part.ALL])