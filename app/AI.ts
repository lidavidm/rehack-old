module NightfallHack {
    export class AIManager {
        public map: BattleMap;
        public state: BattleState;
        public programs: Phaser.Group;
        public player: Phaser.Group;
        private strategy: AIStrategy;
        
        constructor(map, state, programs, playerPrograms) {
            this.map = map;
            this.state = state;
            this.programs = programs;
            this.player = playerPrograms;
            this.strategy = new ChaseStrategy(this, programs);
        }

        startTurn() {
            this.programs.forEach(function(program) {
                program.newTurn();
            }, this);
            this.strategy.runTurn();
        }

        endTurn() {
        }
    }

    class AIStrategy {
        manager: AIManager;
        programs: Phaser.Group;

        constructor(manager, programs) {
            this.manager = manager;
            this.programs = programs;
        }

        runTurn() {
        }

        distanceSquared(program1: BattleProgram, program2: BattleProgram) {
            return Math.pow(program1.x - program2.x, 2) + Math.pow(program1.y - program2.y, 2);
        }

        closestPlayer(program) {
            var playerPrograms = <BattleProgram[]> this.manager.player.children;
            var closest = null;
            var distance = 1000000;
            for (var i = 0; i < playerPrograms.length; i++) {
                var newDistance = this.distanceSquared(program, playerPrograms[i]);
                if (newDistance < distance) {
                    distance = newDistance;
                    closest = playerPrograms[i];
                }
            }

            return closest;
        }

        move(program, direction) {
            program.addHealth(direction);
            if (direction == 'up') {
                program.y -= 34;
            }
            else if (direction == 'right') {
                program.x += 34;
            }
            else if (direction == 'down') {
                program.y += 34;
            }
            else if (direction == 'left') {
                program.x -= 34;
            }
        }

        passable(x, y) {
            return this.manager.state.passable(x, y);
        }

        passableDirection(program: BattleProgram, direction: string) {
            var offset = this.directionToOffset(direction);
            return this.passable(program.tileX + offset.x, program.tileY + offset.y);
        }

        directionToOffset(direction: string): { x: number; y: number } {
            if (direction == 'up') {
                return { x: 0, y: -1 };
            }
            else if (direction == 'right') {
                return { x: 1, y: 0 };
            }
            else if (direction == 'down') {
                return { x: 0, y: 1 };
            }
            else if (direction == 'left') {
                return { x: -1, y: 0 };
            }
        }

        relativeDirection(program1: BattleProgram, program2: BattleProgram): string[] {
            var directions = [];
            if (program2.x > program1.x) {
                directions.push('right');
            }
            else if (program2.x < program1.x) {
                directions.push('left');
            }

            if (program2.y > program1.y) {
                directions.push('down');
            }
            else if (program2.y < program1.y) {
                directions.push('up');
            }

            return directions;
        }
    }

    class ChaseStrategy extends AIStrategy {
        // Moves to nearest player program and attacks it

        runTurn() {
            this.programs.forEach(function(program) {
                var closest = this.closestPlayer(program);
                var directions = this.relativeDirection(program, closest);

                for (var i = 0; i < directions.length; i++) {
                    var direction = directions[i];
                    if (this.passableDirection(program, direction)) {
                        this.move(program, direction);
                    }
                }
            }, this);
        }
    }
}