import { count } from "console";
import { Logger, Part, run, Type } from "../day_utils"
import { ExtendedMap } from "../mapUtils";

function parse(lines: string[]): [string, string][] {
    return lines.map(l => {
        const [a, b] = l.split("-");
        return [a, b]
    });
}

interface Group {
    name: string,
    nodes: Set<string>
}

interface Sets {
    groupIdsCounter: number;
    groups: ExtendedMap<string, Group>;
    links: ExtendedMap<string, Set<string>>
}


const trios = (graph: Map<string, Set<string>>): string[][] => {
    const trios: string[][] = [];

    for (const [node, neighbors] of graph) {
        const neighborArray = Array.from(neighbors);

        for (let i = 0; i < neighborArray.length; i++) {
            for (let j = i + 1; j < neighborArray.length; j++) {
                const [n1, n2] = [neighborArray[i], neighborArray[j]];
                if (graph.get(n1)?.has(n2)) {
                    const trio = [node, n1, n2].sort();
                    trios.push(trio);
                }
            }
        }
    }

    return Array.from(new Set(trios.map((trio) => trio.join(",")))).map((trio) =>
        trio.split(","),
    );
};


function groups(sets: Sets): Group[] {
    let nbMerged = 0;
    let groups = [...sets.groups.values()];
    do {
        let nextGroups: Group[] = [];
        nbMerged = 0;
        for (let pos = 0; pos < groups.length; ++pos) {
            const curr = groups[pos];
            otherLoop: for (let other = pos + 1; other < groups.length; ++other) {
                const toCheck = groups[other];
                for (const missing of toCheck.nodes.difference(curr.nodes)) {
                    const links = sets.links.get(missing)!
                    if (!curr.nodes.isSubsetOf(links)) {
                        continue otherLoop;
                    }
                }
                for (const missing of curr.nodes.difference(toCheck.nodes)) {
                    const links = sets.links.get(missing)!
                    if (!toCheck.nodes.isSubsetOf(links)) {
                        continue otherLoop;
                    }
                }
                toCheck.nodes.forEach(n => curr.nodes.add(n));
                nbMerged++;
                groups.splice(other, 1);
                --other;
            }
            nextGroups.push(curr);
        }
        groups = nextGroups;
    } while (nbMerged > 0)
    return groups;
}

const CACHE_FACTORIAL = new ExtendedMap<number, number>();

function factorial(n: number): number {
    return CACHE_FACTORIAL.cache(n, n => {
        if (n <= 1) {
            return 1;
        }
        return n * factorial(n - 1);
    })
}

function countPart(group: Group, nodesWithT: Set<string>, groupSize: number): number {
    const nbTs = group.nodes.intersection(nodesWithT);
    const n = group.nodes.size;
    const allGroups = factorial(n) / (factorial(groupSize) * factorial(n - groupSize));
    const nWithoutTs = n - nbTs.size;
    if (nWithoutTs < groupSize) {
        return allGroups;
    }
    const groupsWithoutTs = factorial(nWithoutTs) / (factorial(groupSize) * factorial(nWithoutTs - groupSize));
    return allGroups - groupsWithoutTs;
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const pairs = parse(lines);
    const sets: Sets = {
        links: new ExtendedMap(),
        groupIdsCounter: 0,
        groups: new ExtendedMap(),
    };
    pairs.forEach(pair => {
        sets.links.apply(pair[0], l => {
            l.add(pair[1]);
            return l
        }, () => new Set<string>());
        sets.links.apply(pair[1], l => {
            l.add(pair[0]);
            return l
        }, () => new Set<string>());
        const newGroup: Group = {
            name: "grp" + (++sets.groupIdsCounter),
            nodes: new Set(pair)
        };
        sets.groups.set(newGroup.name, newGroup);
    });
    
    if (part === Part.PART_1) {
        const nodes = [...sets.links.keys()];
        const nodesWithTs = new Set(nodes.filter(n => n.startsWith("t")));
    
        let nbFound=0;
        const found:Set<string> = new Set(); 
        for(const nodesWithT of nodesWithTs){
            const links = [...sets.links.get(nodesWithT)!];
            for(let i=0;i<links.length;++i){
                const nodeA = links[i];
                const nodeALinks = sets.links.get(nodeA)!;
                for(let j=i+1;j<links.length;++j){
                    const nodeB = links[j];
                
                    if(nodeALinks.has(nodeB)){
                        nbFound++;
                        found.add([nodesWithT,nodeA,nodeB].sort().join(","));
                    }
                }
            }
        }
        logger.result(found.size, [7, 998])
    }
    else {
        const groupFound = [...groups(sets)].reverseSortIntuitive(g=>g.nodes.size);
        const result = [...groupFound[0].nodes].sort().join(",");
        logger.result(result, ["co,de,ka,ta", "cc,ff,fh,fr,ny,oa,pl,rg,uj,wd,xn,xs,zw"])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 * @see run javadoc
 */
run(23, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])

