import { nb } from "date-fns/locale";
import { Logger, Part, run, Type } from "../day_utils"
import { PackMatchAction } from "../utils";

const pattern = /^.*X[\+,=](\d+), Y[\+,=](\d+)$/;

interface Pos {
    x: number,
    y: number
}
interface Game {
    coefA: Pos,
    coefB: Pos,
    result: Pos
}

function parse(lines: string[]): Game[] {
    return lines.packIf(l => l.trim().length === 0, PackMatchAction.SKIP_AND_CHANGE)
        .map(game => {
            const parseRes = game.map(p => p.match(pattern)!).map(parse => [parseInt(parse[1], 10), parseInt(parse[2], 10)] as const);
            return {
                coefA: {
                    x: parseRes[0][0],
                    y: parseRes[0][1]
                },
                coefB: {
                    x: parseRes[1][0],
                    y: parseRes[1][1]
                },
                result: {
                    x: parseRes[2][0],
                    y: parseRes[2][1]
                }
            }
        });
}


function solveGame(game: Game): number | undefined {
    const det = game.coefA.y * game.coefB.x - game.coefA.x * game.coefB.y;
    if (det === 0) {
        return undefined;
    }

    const nbA = (game.coefB.x * game.result.y - game.coefB.y * game.result.x) / det;
    const nbB = (game.result.x - game.coefA.x * nbA) / game.coefB.x;
    if (Math.floor(nbA) * game.coefA.x + Math.floor(nbB) * game.coefB.x != game.result.x) {
        return;
    }
    return nbA * 3 + nbB;
}

function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    if (part === Part.PART_2) {
        data.forEach(g => {
            g.result.x += 10000000000000;
            g.result.y += 10000000000000;
        })
    }
    const result = data.mapNonNull(solveGame).reduce((a, b) => a + b);
    if (part === Part.PART_1) {
        logger.result(result, [480, 40069])
    }
    else {
        logger.result(result, [875318608908, 71493195288102])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 * @see run javadoc
 */
run(13, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])