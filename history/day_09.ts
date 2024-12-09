import { start } from "repl";
import { Logger, Part, run, Type } from "../day_utils"
import { generator } from "../utils";

function parse(lines: string[]): string {
    return lines[0];
}

interface DiskOffset {
    currBlockId: number;
    currPos: number;
    currSubPos: number;
}

function getNumber(disk: string, pos: number): number {
    return parseInt(disk[pos], 0);
}



function checkSum(disk: string, isPart2: boolean): number {
    let checkSum = 0;
    const maxId = (disk.length - 1) / 2;
    let currGlobalPosition = 0;
    let startOffset: DiskOffset = { currBlockId: 0, currPos: 0, currSubPos: 0 };
    let endOffset: DiskOffset = { currBlockId: maxId, currPos: disk.length - 1, currSubPos: getNumber(disk, disk.length - 1) };
    const notConsumedBlocks: Map<number, DiskOffset> = isPart2 ? [...generator(maxId + 1)].map(id => {
        return {
            currBlockId: id,
            currPos: id * 2,
            currSubPos: getNumber(disk, id * 2)
        }
    }).reverse().reduce<Map<number, DiskOffset>>((m, offset) => { m.set(offset.currBlockId, offset); return m }, new Map()) : new Map();
    let isEnding = (): boolean => {
        if (isPart2) {
            return notConsumedBlocks.size === 0;
        }
        return startOffset.currPos >= endOffset.currPos && (startOffset.currSubPos === endOffset.currSubPos);
    }
    let consumeStdBlock = () => {
        const size = getNumber(disk, startOffset.currPos);
        while (startOffset.currSubPos !== size && (isPart2 || !isEnding())) {
            if (!isPart2 || notConsumedBlocks.has(startOffset.currBlockId)) {
                checkSum += startOffset.currBlockId * (currGlobalPosition++);
            } else {
                currGlobalPosition++;
            }
            startOffset.currSubPos++;
        }
        notConsumedBlocks.delete(startOffset.currBlockId);
        if (isPart2 || !isEnding()) {
            startOffset.currPos++;
            startOffset.currSubPos = 0;
            startOffset.currBlockId++;
        }
    }

    let moveBackBlockEndOffset = (endOffset: DiskOffset) => {
        endOffset.currPos -= 2;
        endOffset.currBlockId--;
        endOffset.currSubPos = getNumber(disk, endOffset.currPos);
    }
    let moveBackEndOffset = (): boolean => {
        endOffset.currSubPos--;
        while (endOffset.currSubPos === 0) {
            moveBackBlockEndOffset(endOffset);
        }
        return false;
    }

    let consumeEmptyBlock = () => {
        const size = getNumber(disk, startOffset.currPos);
        while (startOffset.currSubPos !== size && !isEnding()) {
            checkSum += endOffset.currBlockId * (currGlobalPosition++);
            startOffset.currSubPos++;
            if (moveBackEndOffset()) {
                break;
            }
        }
        if (!isEnding()) {
            startOffset.currPos++;
            startOffset.currSubPos = 0;
        }
    }

    let findMatchingEndOffset = (size: number): DiskOffset | undefined => {
        for (const [blockId, endOffset] of notConsumedBlocks.entries()) {
            if (endOffset.currSubPos <= size) {
                return endOffset;
            }
        }
        return undefined;
    }

    let consumeEmptyBlockPart2 = () => {
        const size = getNumber(disk, startOffset.currPos);
        let endOffset = findMatchingEndOffset(size);
        while (startOffset.currSubPos !== size) {
            if (endOffset !== undefined) {
                checkSum += endOffset.currBlockId * (currGlobalPosition++);
                endOffset.currSubPos--;
                if (endOffset.currSubPos === 0) {
                    notConsumedBlocks.delete(endOffset.currBlockId);
                    endOffset = findMatchingEndOffset(size - startOffset.currSubPos - 1);
                }
            } else {
                currGlobalPosition++;
            }
            startOffset.currSubPos++;
        }

        startOffset.currPos++;
        startOffset.currSubPos = 0;
    }

    while (!isEnding()) {
        consumeStdBlock();
        if (isPart2) {
            consumeEmptyBlockPart2();
        } else {
            consumeEmptyBlock();
        }
    }
    return checkSum;
}

function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    const result = checkSum(data, part === Part.PART_2);
    if (part === Part.PART_1) {
        logger.result(result, [1928, 6366665108136])
    }
    else {
        logger.result(result, [2858, 6398065450842])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 * @see run javadoc
 */
run(9, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])