import { unwatchFile } from "fs";
import { Logger, Part, run, Type } from "../day_utils"
import { World2D } from "../map2d.utils";
import { ExtendedMap } from "../mapUtils";

interface Cell {
    v: string,
    visited: boolean,
    regionId?: number,
    sides: Set<World2D.Dir>
}

interface Side {
    id: number,
    dir: World2D.Dir,
    size: number,
    pos: number
}

interface Region {
    id: number,
    v: string,
    area: number,
    perimeter: number,
    sides: ExtendedMap<number, Side>
}

type World = { map: World2D.Map2d<Cell>, regions: ExtendedMap<number, Region> }

function parse(lines: string[]): World {
    return {
        map: new World2D.Map2d(lines.map(l => l.split("").map(v => { return { v, visited: false, sides: new Set() } satisfies Cell }))),
        regions: new ExtendedMap()
    };
}


function processSide(w: World, v: string, currPos: World2D.Pos, side: Side, dir?: World2D.Dir | undefined) {
    const cell = w.map.cell_opt(currPos);
    if (cell === undefined
        || cell.v !== v
        || cell.sides.has(side.dir)
        || w.map.cell_opt(World2D.move_pos(currPos, side.dir))?.v === v
    ) {
        return;
    }
    cell.sides.add(side.dir);
    side.size++;
    if (dir) {
        processSide(w, v, World2D.move_pos(currPos, dir), side, dir);
    }
    else if (side.dir === World2D.Dir.DOWN || side.dir === World2D.Dir.UP) {
        processSide(w, v, World2D.move_pos(currPos, World2D.Dir.LEFT), side, World2D.Dir.LEFT);
        processSide(w, v, World2D.move_pos(currPos, World2D.Dir.RIGHT), side, World2D.Dir.RIGHT);
    }
    else if (side.dir === World2D.Dir.LEFT || side.dir === World2D.Dir.RIGHT) {
        processSide(w, v, World2D.move_pos(currPos, World2D.Dir.UP), side, World2D.Dir.UP);
        processSide(w, v, World2D.move_pos(currPos, World2D.Dir.DOWN), side, World2D.Dir.DOWN);
    }
}

function processCell(w: World, currPos: World2D.Pos, region: Region | undefined): void {
    const currCell = w.map.cell(currPos);
    if (currCell.regionId !== undefined) {
        return;
    }
    if (region === undefined) {
        region = {
            area: 0,
            perimeter: 0,
            id: w.regions.size,
            v: currCell.v,
            sides: new ExtendedMap()
        }
        w.regions.set(region.id, region);
    }
    region.area++;
    currCell.regionId = region.id
    for (const dir of World2D.ALL_DIRECTIONS) {
        const pos = World2D.move_pos(currPos, dir);
        const cell = w.map.cell_opt(pos);
        if (cell === undefined || cell.v !== currCell.v) {
            region.perimeter++;
            if (!currCell.sides.has(dir)) {
                const side: Side = { id: region.sides.size, dir, pos: [World2D.Dir.DOWN, World2D.Dir.UP].includes(dir) ? currPos.y : currPos.x, size: 0 };
                region.sides.set(side.id, side);
                processSide(w, currCell.v, currPos, side);
            }
        } else {
            if (cell.regionId === undefined) {
                processCell(w, pos, region);
            }
        }
    }
}

function calcPrice(w: World, logger: Logger): [number, number] {
    w.map.apply_to_all(World2D.Dir.RIGHT, World2D.Dir.DOWN, (currPos) => {
        processCell(w, currPos, undefined);
    })
    return [...w.regions.values()].reduce((s, c) => [s[0] + c.area * c.perimeter, s[1] + c.area * c.sides.size], [0, 0]);
}

function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    const result = calcPrice(data, logger);
    logger.result(result, [1930, 1485656, 1206, 899196]);
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 * @see run javadoc
 */
run(12, [Type.TEST, Type.RUN], puzzle, [Part.ALL])