import { Logger, Part, run, Type } from "./day_utils"
import { World2D } from "./map2d.utils";

const POS_NUMPAD: World2D.Pos[] = [];
POS_NUMPAD[0x7] = { x: 0, y: 0 };
POS_NUMPAD[0x8] = { x: 1, y: 0 };
POS_NUMPAD[0x9] = { x: 2, y: 0 };

POS_NUMPAD[0x4] = { x: 0, y: 1 };
POS_NUMPAD[0x5] = { x: 1, y: 1 };
POS_NUMPAD[0x6] = { x: 2, y: 1 };

POS_NUMPAD[0x1] = { x: 0, y: 2 };
POS_NUMPAD[0x2] = { x: 1, y: 2 };
POS_NUMPAD[0x3] = { x: 2, y: 2 };

POS_NUMPAD[0x0] = { x: 1, y: 3 };
POS_NUMPAD[0xA] = { x: 2, y: 3 };

enum Action {
    UP = 0,
    DOWN = 1,
    LEFT = 2,
    RIGHT = 3,
    ACTION = 4
}

const POS_DIRPAD: World2D.Pos[] = [];
POS_DIRPAD[Action.UP] = { x: 1, y: 0 };
POS_DIRPAD[Action.ACTION] = { x: 2, y: 0 };
POS_DIRPAD[Action.LEFT] = { x: 0, y: 1 };
POS_DIRPAD[Action.DOWN] = { x: 1, y: 1 };
POS_DIRPAD[Action.RIGHT] = { x: 2, y: 1 };


function parse(lines: string[]): number[][] {
    return lines.map(l => l.split("").map(n => parseInt(n, 16)));
}





function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    if (part === Part.PART_1) {
        const result = data.length;
        logger.result(result, [undefined, undefined])
    }
    else {
        const result = data.length;
        logger.result(result, [undefined, undefined])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 * @see run javadoc
 */
run(21, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])