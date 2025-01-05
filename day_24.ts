import { getRandomValues } from "crypto";
import { Logger, Part, run, Type } from "./day_utils"
import { ExtendedMap } from "./mapUtils";
import { generator, PackMatchAction } from "./utils";

interface WireState {
    value: boolean | undefined;
    dependancies: Set<string> | undefined;
}

interface Wire {
    name: string,
    initialValue?: boolean,
    previous?: Gate,
    state: WireState,
    users: Gate[]
}

enum Operator {
    AND = "AND",
    XOR = "XOR",
    OR = "OR"
}

interface GateState {
    output: boolean | undefined,
    dependancies: Set<string> | undefined;
}

interface Gate {
    operator: Operator,
    inputs: [string, string],
    inputGates?: [Gate | undefined, Gate | undefined],
    output: string,
    state: GateState
}

const PATTERN = /(\w+) (AND|OR|XOR) (\w+) -> (\w+)/;

interface WireBoard {
    wires: ExtendedMap<string, Wire>,
    gates: Gate[]
}

function initWire(name: string, initValue?: boolean): Wire {
    return {
        name,
        initialValue: initValue,
        users: [],
        state: { value: initValue, dependancies: undefined }
    }
}

function parse(lines: string[]): WireBoard {
    const [initValues, links] = lines.packIf(l => l.trim().length === 0, PackMatchAction.SKIP_AND_CHANGE);
    const wires = new ExtendedMap<string, Wire>()
    initValues.forEach(l => {
        const [name, value] = l.split(": ");
        wires.set(name, initWire(name, value === "1"))
    });
    const gates = links.map(l => {
        const matching = l.match(PATTERN)!;
        const gate: Gate = {
            output: matching[4],
            inputs: [matching[1], matching[3]],
            operator: matching[2] as Operator,
            state: {
                output: undefined,
                dependancies: undefined
            }
        };
        wires.apply(gate.output, (wire) => {
            if (wire.previous !== undefined) {
                throw new Error("Shouldn't occurs");
            }
            wire.previous = gate;
            return wire
        }, () => initWire(gate.output))
        gate.inputs.forEach(name => {
            wires.apply(name, (wire) => {
                wire.users.push(gate)
                return wire;
            }, () => initWire(name))
        })
        return gate;
    });
    gates.forEach(gate => {
        gate.inputGates = gate.inputs.map(n => wires.get(n)?.previous) as [Gate | undefined, Gate | undefined]
    })
    return {
        gates,
        wires
    }
}

function getDependancies(data: WireBoard, wireName: string): Set<string> {
    const wire = data.wires.get(wireName)!
    if (wire.state.dependancies !== undefined) {
        return wire.state.dependancies;
    }
    const gate = wire.previous;
    if (gate === undefined) {
        return new Set([wire.name]);
    }
    wire.state.dependancies = new Set([
        ...getDependancies(data, gate.inputs[0]),
        ...getDependancies(data, gate.inputs[1])
    ]);
    gate.state.dependancies = wire.state.dependancies;
    return wire.state.dependancies;
}


function getValue(data: WireBoard, wireName: string): boolean {
    const wire = data.wires.get(wireName)!
    if (wire.state.value !== undefined) {
        return wire.state.value;
    }
    const gate = wire.previous;
    if (gate === undefined) {
        throw new Error("Not possible");
    }
    if (gate.state.output === undefined) {
        const valueA = getValue(data, gate.inputs[0]);
        const valueB = getValue(data, gate.inputs[1]);
        switch (gate.operator) {
            case Operator.AND: gate.state.output = valueA && valueB; break;
            case Operator.OR: gate.state.output = valueA || valueB; break;
            case Operator.XOR: gate.state.output = (valueA !== valueB); break;
        }
    }
    wire.state.value = gate.state.output;
    return wire.state.value;
}

function nameFromIndex(index: number): string {
    const valString = index.toString();
    return "0".repeat(2 - valString.length) + valString;
}

function resetDependancies(board: WireBoard, wire: Wire) {
    wire.state.dependancies = undefined;
    wire.users.forEach(user => {
        user.state.dependancies = undefined;
        resetDependancies(board, board.wires.get(user.output)!);
    })
}

function swap(board: WireBoard, wire: Wire, gate: Gate | undefined, users: Gate[]) {
    wire.previous = gate;
    if (gate !== undefined) {
        gate.output = wire.name;
    }
    wire.users = users.map(user => {
        const inputGates = user.inputGates;
        if (inputGates !== undefined) {
            for (let pos = 0; pos < inputGates.length; ++pos) {
                if (inputGates[pos] === gate) {
                    inputGates[pos] = gate;
                    user.inputs[pos] = wire.name;
                }
            }

            return user;
        }
        return user;
    });
    resetDependancies(board, wire);
}

function invertWires(board: WireBoard, firstName: string, secondName: string) {
    const firstWire = board.wires.get(firstName)!;
    const secondWire = board.wires.get(secondName)!;
    const firstPrevious = firstWire.previous;
    const firstUsers = firstWire.users;
    const secondPrevious = secondWire.previous;
    const secondUsers = secondWire.users;

    //Swap
    swap(board, firstWire, secondPrevious, secondUsers);
    swap(board, secondWire, firstPrevious, firstUsers);

    for (const name of board.wires.keys()) {
        getDependancies(board, name);
    }
}

function processCrossWires(board: WireBoard, logger: Logger): string[] {
    const result: string[] = [];
    for (const name of board.wires.keys()) {
        getDependancies(board, name);
    }
    const zEntries = [...board.wires.keys()].filter(n => n.startsWith("z")).sort();
    mainLoop: for (const [index, currOutputName] of zEntries.entries()) {
        const wire = board.wires.get(currOutputName)!;
        const wireDependancies = wire.state.dependancies!;
        const expectedDependancies = new Set([...generator(index + 1)].map(nameFromIndex).flatMap(suffix => ["x" + suffix, "y" + suffix]));
        if (wireDependancies.symmetricDifference(expectedDependancies).size === 0) {
            continue;
        }
        const potentialPossibilities: Wire[] = [];
        // try find exact match
        for (const [otherWireName, otherWire] of board.wires.entries()) {
            const dependancies = getDependancies(board, otherWireName);

            if (dependancies!.symmetricDifference(expectedDependancies).size === 0) {
                potentialPossibilities.push(otherWire);
                logger.debug("found exact match " + otherWireName + " for " + currOutputName);
            }
        }

        //
        const unexpectedDependancies = wireDependancies.difference(expectedDependancies);
        const missingDependancies = expectedDependancies.difference(wireDependancies);

    }

    return result;
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    if (part === Part.PART_1) {
        const values = [...data.wires.keys()].filter(n => n.startsWith("z")).reverseSort()
            .map(name => getValue(data, name));

        const result = parseInt(values.map(v => (v ? "1" : "0")).join(""), 2);
        logger.result(result, [2024, 61886126253040])
    }
    else {
        processCrossWires(data, logger);
        logger.result("", ["aaa,aoc,bbb,ccc,eee,ooo,z24,z99", undefined])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 * @see run javadoc
 */
run(24, [Type.RUN], puzzle, [Part.PART_2], { debug: true })