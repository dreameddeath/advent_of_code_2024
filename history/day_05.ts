import { ru } from "date-fns/locale";
import { Logger, Part, run, Type } from "../day_utils"
import { ExtendedMap } from "../mapUtils";
type RulesMap = ExtendedMap<number, number[]>;
interface ParsingState {
    isUpdatePhase: boolean
    pagesMustBeAfterPerPage: RulesMap;
    pagesMustBeBeforePerPage: RulesMap;
    updates: number[][];
}
function parse(lines: string[]): ParsingState {

    return lines.reduce<ParsingState>((s, l) => {
        if (l === "") {
            return { ...s, isUpdatePhase: true };
        }
        if (s.isUpdatePhase) {
            return { ...s, updates: s.updates.concat([l.split(",").map(n => parseInt(n, 10))]) }
        }
        const [k, v] = l.split("|").map(n => parseInt(n, 10));
        s.pagesMustBeAfterPerPage.apply(k, (c, _k) => c.concat([v]), () => [])
        s.pagesMustBeBeforePerPage.apply(v, (c, _k) => c.concat([k]), () => [])
        return s;
    },
        { pagesMustBeAfterPerPage: new ExtendedMap(), pagesMustBeBeforePerPage: new ExtendedMap(), updates: [], isUpdatePhase: false });
}



function manageOrder(u: number[], s: ParsingState): { isReordered: boolean, pages: number[] } {
    const seenPages = new ExtendedMap<number, number>();
    let isReordered = false;
    u.forEach((v, i) => seenPages.set(v, i));
    const newArray = u.sortCopy((a, b) => {
        if ((s.pagesMustBeAfterPerPage.get(a) ?? []).includes(b)) {
            isReordered = true;
            return -1;
        } else if ((s.pagesMustBeBeforePerPage.get(b) ?? []).includes(a)) {
            isReordered = true;
            return 1;
        }

        return seenPages.get(a)! - seenPages.get(b)!;
    })
    return { isReordered, pages: isReordered ? newArray : u };
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    const withReorder = data.updates.map(u => manageOrder(u, data));
    const result = withReorder
        .reduce<[number, number]>((s, o) => {
            const middle = o.pages[Math.floor(o.pages.length / 2)];
            if (o.isReordered) {
                s[1] += middle;
            } else {
                s[0] += middle;
            }
            return s;
        }, [0, 0]);

    logger.result(result, [143, 5651, 123, 4743])
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(5, [Type.TEST, Type.RUN], puzzle, [Part.ALL])