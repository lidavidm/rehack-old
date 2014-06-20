module NightfallHack {
    export interface ProgramInfo {
        name: string;
        texture: string;
        maxHealth: number;
        maxMoves: number;
        commands: ProgramCommand[];
    }

    export enum CommandType {
        Targeted,
        Untargeted
    }

    export enum CommandTargetType {
        Ally,
        Enemy,
        Self,
        Passable,
        Unpassable
    }

    export interface ProgramCommand {
        name: string;
        handler?: any;
        type?: CommandType;
        range?: number;
    }

    // TODO subclass Program to provide custom behaviors?
    export var Programs = {
        Backdoor: {
            name: "Backdoor",
            texture: "backdoor",
            maxHealth: 3,
            maxMoves: 1,
            commands: [{
                name: "Open Backdoor"
            }]
        },

        Exploit1: {
            name: "Exploit Level I",
            texture: "exploit1",
            maxHealth: 6,
            maxMoves: 3,
            commands: [{
                name: "Clear Memory",
                type: CommandType.Targeted,
                target: CommandTargetType.Enemy,
                range: 2,
                handler: (target: BattleProgram, state: BattleState) => {
                    target.damage(2);
                }
            }]
        },

        MacAFee: {
            name: "MacAFee Security Suite",
            texture: "macafee",
            maxHealth: 4,
            maxMoves: 2,
            commands: [{
                name: "Quarantine",
                type: CommandType.Targeted,
                target: CommandTargetType.Enemy,
                range: 2,
                handler: (target: BattleProgram, state: BattleState) => {
                    target.damage(target.maxHealth - 1);
                }
            }]
        }
    };
}