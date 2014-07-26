module NightfallHack {
    export interface NetworkGraph {
        [location: string]: NetworkLocation;
    }

    export interface NetworkLocation {
        name: string;
        owned: boolean;
        parent: string;
        map: string;
    }

    export interface Inventory {
        [item: string]: number;
    }

    export class SaveGame {
        name: string = "Saved Game 01";
        netData: NetworkGraph = {
            "1:1": {
                name: "Home—CORE",
                owned: true,
                parent: null,
                map: "map_01"
            },
            "4:1": {
                name: "Enemy PC #1",
                owned: false,
                parent: "1:1",
                map: "map_pc1"
            },
            "6:2": {
                name: "Enemy PC #2",
                owned: false,
                parent: "4:1",
                map: "map_01"
            },
            "1:4": {
                name: "Enemy PC #3",
                owned: false,
                parent: "6:2",
                map: "map_01"
            },
            "6:6": {
                name: "Enemy PC #4",
                owned: false,
                parent: "4:1",
                map: "map_01"
            },
            "2:6": {
                name: "Enemy PC #5",
                owned: false,
                parent: "1:4",
                map: "map_01"
            }
        };
        programs: Inventory = {
            "Exploit1": 2
        };
        netcoins: number = 0;

        quests = new QuestManager();

        constructor(name: string) {
        }

        load() {
        }

        save() {
        }
    }
}