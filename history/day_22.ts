import { Logger, Part, run, Type } from "../day_utils"
import { ExtendedMap } from "../mapUtils";
import { generator } from "../utils";

function parse(lines: string[]): number[] {
    return lines.map(l => parseInt(l, 10));
}


function mix(n: number, s: number): number {
    return (n ^ s) >>> 0;
}
function prune(n: number): number {
    return n % 16777216;
}

function next(n: number): number {
    n = prune(mix((n * 64), n));
    n = prune(mix(Math.floor(n / 32), n));
    n = prune(mix(n * 2048, n));
    return n;
}

interface Caches {
    perSequence: ExtendedMap<string, number>;
    perSequenceAndRank: Set<string>;
}


function calculate(n: number, max_rank: number, rank: number, cachePriceChanges: Caches): number {
    const prices: number[] = [n % 10];
    const deltas: number[] = [];
    for (let i = 0; i < max_rank; ++i) {
        n = next(n);
        const price = n % 10;
        prices.unshift(price);
        if (prices.length >= 2) {
            deltas.unshift(prices[0] - prices[1]);
        }
        if (prices.length > 4) {
            prices.pop();
        }
        if (deltas.length > 4) {
            deltas.pop();
        }
        if (deltas.length === 4) {
            const key = deltas.reverseCopy().join(",");
            const keyPerRank = key + "#" + rank;
            if (!cachePriceChanges.perSequenceAndRank.has(keyPerRank)) {
                cachePriceChanges.perSequenceAndRank.add(keyPerRank);
                cachePriceChanges.perSequence.apply(key,
                    (c) => c + price,
                    () => 0
                )
            }
        }
    }
    return n;
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    logger.assert(mix(15, 42), 37, "Bad mix");
    logger.assert(prune(100000000), 16113920, "Bad prune");
    const simulation = [...generator(10)].reduce((l, n) => [...l, next(l[n])], [123])
    logger.assert(simulation, [123, 15887950,
        16495136,
        527345,
        704524,
        1553684,
        12683156,
        11100544,
        12249484,
        7753432,
        5908254],
        "Bad simulation"
    );
    const cachePriceChanges: Caches = {
        perSequence: new ExtendedMap(),
        perSequenceAndRank: new Set()
    };
    const data = parse(lines);
    const result = data.map((n, rank) => calculate(n, 2000, rank, cachePriceChanges)).reduce((a, b) => a + b);
    let resultPart2: number = 0;
    {
        if (type === Type.TEST) {
            cachePriceChanges.perSequence.clear();
            cachePriceChanges.perSequenceAndRank.clear();
            [1, 2, 3, 2024].map((n, rank) => calculate(n, 2000, rank, cachePriceChanges)).reduce((a, b) => a + b);
        }
        const sorted = [...cachePriceChanges.perSequence.entries()].reverseSortIntuitive(i => i[1]);
        resultPart2 = sorted[0][1];
    }
    logger.result([result, resultPart2], [37327623, 13584398738, 23, 1612])
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 * @see run javadoc
 */
run(22, [Type.TEST, Type.RUN], puzzle, [Part.ALL])