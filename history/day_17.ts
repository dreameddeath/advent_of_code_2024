import { Logger, Part, run, Type } from "../day_utils"

enum Opcode {
    adv = 0,
    bxl = 1,
    bst = 2,
    jnz = 3,
    bxc = 4,
    out = 5,
    bdv = 6,
    cdv = 7
}

enum Operand {
    val_0 = 0,
    val_1 = 1,
    val_2 = 2,
    val_3 = 3,
    val_regA = 4,
    val_regB = 5,
    val_regC = 6,
    unknown = 7
}

enum OperandType {
    LITERAL = 0,
    COMBO = 1,
}
type LiteralOperand = {
    type: OperandType.LITERAL,
    value: number
}
type ComboOperand = {
    type: OperandType.COMBO,
    register: Reg
}
type RealOperand = LiteralOperand | ComboOperand;

enum ActionType {
    DIVIDE = "DIV",
    XOR = "XOR",
    MOD_8 = "MOD",
    PRINT = "PRINT",
    JUMP_NON_0 = "JMP"
}

interface ActionDef {
    type: ActionType,
}

enum Reg {
    A = 0,
    B = 1,
    C = 2
}

const REG_STR = ["A", "B", "C"];

interface ActionDef {
    param0: RealOperand,
    param1?: RealOperand,
    type: ActionType,
    effectiveAction: ActionResult
}
interface ActionResultSet {
    type: "set",
    reg: Reg,
    describe: (p0?: string, p1?: string) => string,
    value: (v1: number, v2?: any) => number,
}

type ActionResultJump = {
    type: "jump",
    describe: (p0?: string, p1?: string) => string,
    value: (v1: number, v2?: any) => number | undefined,
}

type ActionResultPrint = {
    type: "print",
    describe: (p0?: string, p1?: string) => string,
    value: (v1: number, v2?: any) => number,
}
type ActionResult = ActionResultSet | ActionResultJump | ActionResultPrint;

interface Instruction {
    opcode: Opcode,
    operand: Operand,
    action: ActionDef
}


function buildDivideResult(targetReg: Reg): ActionResultSet {
    return {
        type: "set",
        reg: targetReg,
        describe: (p0, p1) => `REG[${REG_STR[targetReg]}] <-- floor( ${p0} / 2**${p1})`,
        value: (aReg: number, v: number) => {
            const val = (2 ** v);
            const result = Math.trunc(aReg / val);
            return result;
        }
    }
}


function buildXorFct(targetReg: Reg): ActionResultSet {
    return {
        type: "set",
        reg: targetReg,
        describe: (p0, p1) => `REG[${REG_STR[targetReg]}] <-- ${p0} ^ ${p1}`,
        value: (regValue: number, v: number) => {
            const result = (regValue ^ v) >>> 0;
            return result
        }

    }
}


function buildJumpFct(): ActionResultJump {
    return {
        type: "jump",
        describe: (p0, p1) => `IF (${p0}!==0) THEN GOTO ${p1}`,
        value: (regValue: number, pc: number) => regValue !== 0 ? pc : undefined
    }
}


function buildMod8Fct(targetReg: Reg): ActionResultSet {
    return {
        type: "set",
        reg: targetReg,
        describe: (p0) => `REG[${REG_STR[targetReg]}] <-- ${p0} % 8`,
        value: (regValue: number) => regValue % 8
    };
}



function buildPrintFct(): ActionResultPrint {
    return {
        type: "print",
        describe: (p0) => `PRINT (${p0} % 8)`,
        value: (regValue: number) => regValue % 8
    };
}



interface Cpu {
    reg: [number, number, number],
    pc: number,
    instructions: Instruction[]
}


function decodeComplexOperand(operand: Operand): RealOperand {
    switch (operand) {
        case Operand.val_0:
        case Operand.val_1:
        case Operand.val_2:
        case Operand.val_3:
            return {
                type: OperandType.LITERAL,
                value: operand
            };
        case Operand.val_regA:
        case Operand.val_regB:
        case Operand.val_regC:
            return {
                type: OperandType.COMBO,
                register: operand - Operand.val_regA,
            }
        case Operand.unknown:
            throw new Error("Unkown Combo");
    }
}

function decodeOpcode(opcode: Opcode, operand: Operand): ActionDef {
    switch (opcode) {
        case Opcode.adv:
            return {
                type: ActionType.DIVIDE,
                param0: {
                    type: OperandType.COMBO,
                    register: Reg.A,
                },
                param1: decodeComplexOperand(operand),
                effectiveAction: buildDivideResult(Reg.A)
            }
        case Opcode.bxl:
            return {
                type: ActionType.XOR,
                param0: {
                    type: OperandType.COMBO,
                    register: Reg.B,
                },
                param1: {
                    type: OperandType.LITERAL,
                    value: operand
                },
                effectiveAction: buildXorFct(Reg.B)
            }
        case Opcode.bst:
            return {
                type: ActionType.MOD_8,
                param0: decodeComplexOperand(operand),
                effectiveAction: buildMod8Fct(Reg.B)
            }
        case Opcode.jnz:
            return {
                type: ActionType.JUMP_NON_0,
                param0: {
                    type: OperandType.COMBO,
                    register: Reg.A
                },
                param1: {
                    type: OperandType.LITERAL,
                    value: operand
                },
                effectiveAction: buildJumpFct()
            }
        case Opcode.bxc:
            return {
                type: ActionType.XOR,
                param0: { type: OperandType.COMBO, register: Reg.B },
                param1: { type: OperandType.COMBO, register: Reg.C },
                effectiveAction: buildXorFct(Reg.B)
            }
        case Opcode.out:
            return {
                type: ActionType.PRINT,
                param0: decodeComplexOperand(operand),
                effectiveAction: buildPrintFct()
            }
        case Opcode.bdv:
            return {
                type: ActionType.DIVIDE,
                param0: {
                    type: OperandType.COMBO,
                    register: Reg.A,
                },
                param1: decodeComplexOperand(operand),
                effectiveAction: buildDivideResult(Reg.B),

            }

        case Opcode.cdv:
            return {
                type: ActionType.DIVIDE,
                param0: {
                    type: OperandType.COMBO,
                    register: Reg.A,
                },
                param1: decodeComplexOperand(operand),
                effectiveAction: buildDivideResult(Reg.C),
            };
    }
}

function parse(lines: string[]): Cpu {
    const [_nregA, regAStr] = lines[0].split(/\s*:\s*/);
    const [_nregB, regBStr] = lines[1].split(/\s*:\s*/);
    const [_nregC, regCStr] = lines[2].split(/\s*:\s*/);
    const [_nprog, instructionsStr] = lines[4].split(/\s*:\s*/);
    return {
        reg: [parseInt(regAStr, 10), parseInt(regBStr, 10), parseInt(regCStr, 10)],
        pc: 0,
        instructions: instructionsStr.split(",").packStrict(2).map(i => {
            const opcode = parseInt(i[0], 10);
            const operand = parseInt(i[1], 10);
            return {
                opcode: opcode,
                operand: operand,
                action: decodeOpcode(opcode, operand)
            } satisfies Instruction
        })
    };
}


function getParam(cpu: Cpu, operand: RealOperand): number {
    if (operand.type === OperandType.LITERAL) {
        return operand.value
    } else {
        return cpu.reg[operand.register];
    }
}

function runInstruction(cpu: Cpu): number | undefined {
    const instruction = cpu.instructions[cpu.pc];
    const action = instruction.action;
    const param0Value = getParam(cpu, action.param0);
    const param1Value = action.param1 ? getParam(cpu, action.param1) : undefined;
    const actionRes = action.effectiveAction;
    if (actionRes.type === "jump") {
        const newPc = actionRes.value(param0Value, param1Value);
        if (newPc !== undefined) {
            cpu.pc = newPc;
            return undefined;
        }
    }
    cpu.pc++;
    switch (actionRes.type) {
        case "print": return actionRes.value(param0Value, param1Value);
        case "set": cpu.reg[actionRes.reg] = actionRes.value(param0Value, param1Value); break;
    }
}

function runCpu(cpu: Cpu): number[] {
    const output: number[] = []
    while (cpu.pc < cpu.instructions.length) {
        const res = runInstruction(cpu);
        if (res !== undefined) {
            output.push(res);
        }
        if (output.length > 100) {
            throw new Error("Infinite loop")
        }
    }
    return output
}

const tests = [
    {
        lines: [
            "Register A: 0",
            "Register B: 0",
            "Register C: 9",
            "",
            "Program: 2,6",
        ],
        output: "",
        regs: [0, 1, 9]
    },
    {
        lines: [
            "Register A: 10",
            "Register B: 0",
            "Register C: 0",
            "",
            "Program: 5,0,5,1,5,4",
        ],
        output: "0,1,2",
        regs: [10, 0, 0]
    },
    {
        lines: [
            "Register A: 2024",
            "Register B: 0",
            "Register C: 0",
            "",
            "Program: 0,1,5,4,3,0",
        ],
        output: "4,2,5,6,7,7,7,7,3,1,0",
        regs: [0, 0, 0]
    },
    {
        lines: [
            "Register A: 0",
            "Register B: 29",
            "Register C: 0",
            "",
            "Program: 1,7",
        ],
        output: "",
        regs: [0, 26, 0]
    },
    {
        lines: [
            "Register A: 0",
            "Register B: 2024",
            "Register C: 43690",
            "",
            "Program: 4,0",
        ],
        output: "",
        regs: [0, 44354, 43690]
    },
]

const A = "A".charCodeAt(0);
function printParam(operand: RealOperand | undefined): string | undefined {
    if (operand === undefined) {
        return undefined;
    }
    if (operand.type === OperandType.LITERAL) {
        return operand.value.toString();
    } else {
        return "REG[" + String.fromCharCode(A + operand.register) + "]";
    }
}

function printInstruction(i: Instruction, index: number): string {
    const indexStr = index.toString();
    const start = (" ".repeat(5 - indexStr.length)) + indexStr + " : ";
    const action = i.action;
    const paramA = printParam(action.param0);
    const paramB = printParam(action.param1);
    return start + action.effectiveAction.describe(paramA, paramB)

}

function printInstructions(cpu: Cpu, logger: Logger) {
    if (!logger.isdebug()) {
        return;
    }

    logger.debug(["Instructions", ...cpu.instructions.map((i, index) => printInstruction(i, index))]);
}

function checkCpu(newValue: number, data: Cpu, partialExpected: number[]): number | undefined {
    const cpuTest: Cpu = {
        instructions: data.instructions,
        pc: 0,
        reg: [newValue, data.reg[1], data.reg[2]]
    }
    const foundValues = runCpu(cpuTest);
    if (partialExpected.length <= foundValues.length) {
        if (foundValues.filter((v, i) => v !== partialExpected[i]).length === 0) {
            return newValue;
        }
    }
    return undefined
}

function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    if (part === Part.PART_1 && type === Type.TEST) {
        for (const test of tests) {
            const cpu = parse(test.lines);
            const result = runCpu(cpu);
            logger.assert(result.join(","), test.output, "Bad output")
            logger.assert(cpu.reg[0], test.regs[0], "Bad RegA : " + cpu.reg[0]);
            logger.assert(cpu.reg[1], test.regs[1], "Bad RegB : " + cpu.reg[1]);
            logger.assert(cpu.reg[2], test.regs[2], "Bad RegC : " + cpu.reg[2]);
        }
    }

    const data = parse(lines);
    if (part === Part.PART_1) {
        const resultParts = runCpu(data);
        const result = resultParts.join(",");
        logger.result(result, ["4,6,3,5,6,3,5,2,1,0", "3,5,0,1,5,1,5,1,0"])
    }
    else {
        printInstructions(data, logger);
        const expectedValues = data.instructions.flatMap(i => [i.opcode satisfies number, i.operand satisfies number]).reverseCopy();
        const refValue = 2 ** 24;
        const cpuOneLoop: Cpu = { instructions: data.instructions.filter(i => i.action.type !== ActionType.JUMP_NON_0), reg: [refValue, 0, 0], pc: 0 };
        runCpu(cpuOneLoop);
        const shiftEstimate = Math.round(Math.log2(refValue) - Math.log2(cpuOneLoop.reg[0]));
        const offsetMult = 2 ** shiftEstimate;
        let currValue = 0;
        const maxValue: number = 2 ** (8 * 2);
        for (const [index, expectedValue] of expectedValues.entries()) {
            let foundA = undefined;
            const previous = currValue;
            currValue *= offsetMult;
            if (currValue < 0) {
                throw new Error("KO");
            }
            const partialExpectedValues = expectedValues.slice(0, index + 1).reverse();
            let newValue;
            for (let aTestValue = 0; aTestValue < maxValue; ++aTestValue) {
                newValue = currValue + aTestValue;
                const checkResult = checkCpu(newValue, data, partialExpectedValues);
                if (checkResult !== undefined) {
                    foundA = checkResult;
                    break;
                }
            }
            if (foundA === undefined) {
                console.log("Not found " + expectedValue + " at pos " + index);
            } else {
                currValue = foundA;
            }
        }
        logger.result(currValue, [117440, 107413700225434])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 * @see run javadoc
 */
run(17, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2], { debug: false })