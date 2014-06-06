module NightfallHack {
    export interface ProgramInfo {
        name: string;
        texture: string;
        maxHealth: number;
        maxMoves: number;
        commands: UiObjectCommand[];
    }
    
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
                name: "Clear Memory"
            }]
        },

        MacAFee: {
            name: "MacAFee Security Suite",
            texture: "macafee",
            maxHealth: 4,
            maxMoves: 2,
            commands: [{
                name: "Quarantine"
            }]
        }
    };
}