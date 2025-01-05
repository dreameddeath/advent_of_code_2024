import { Key } from "readline";
import { Logger, Part, run, Type } from "../day_utils"
import { PackMatchAction } from "../utils";
import { de } from "date-fns/locale";

enum TypeItem {
    KEY,
    LOCK
}

type Schematics = string[];
interface Item {
    type: TypeItem,
    schematics: Schematics
}

function parse(lines: string[]): Item[] {
    return lines.packIf(l => l.trim().length === 0, PackMatchAction.SKIP_AND_CHANGE).map(def => {
        return {
            type: def[0].match(/#{5}/) ? TypeItem.LOCK : TypeItem.KEY,
            schematics: def
        }
    });
}

function match(key: Schematics, lock: Schematics): boolean {
    const width = key[0].length;
    for (let line = 1; line < key.length - 1; ++line) {
        const keyLine = key[line];
        const lockLine = lock[line];
        for (let col = 0; col < width; ++col) {
            if (keyLine[col] === "#" && lockLine[col] === "#") {
                return false;
            }
        }
    }
    return true;
}

function countMatch(data: Item[]): number {
    const keys = data.filter(item => item.type === TypeItem.KEY);
    const locks = data.filter(item => item.type === TypeItem.LOCK);
    let count = 0;
    for (const key of keys) {
        for (const lock of locks) {
            if (match(key.schematics, lock.schematics)) {
                count++;
            }
        }
    }
    return count;
}

function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);

    const result = countMatch(data);
    logger.result(result, [3, undefined])

}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 * @see run javadoc
 */
run(25, [Type.TEST, Type.RUN], puzzle, [Part.PART_1])