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

            this.manager.map.occupy(program.tileX, program.tileY);
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

        commandInRange(program: BattleProgram, commandIndex: number, target: BattleProgram): boolean {
            // TODO check against health tiles as well
            var range = program._program.commands[commandIndex].range;
            var distance = Math.pow(target.tileX - program.tileX, 2) +
                Math.pow(target.tileY - program.tileY, 2);
            return distance < Math.pow(range, 2);
        }

        targetedCommand(program: BattleProgram, commandIndex: number, target: BattleProgram) {
            var command = program._program.commands[commandIndex];
            if (!this.commandInRange(program, commandIndex, target)) {
                throw "AI attempted to use command while not in range";
            }
            command.handler(target, this.manager.state);
        }

        // A* algorithm
        // http://theory.stanford.edu/~amitp/GameProgramming/ImplementationNotes.html
        findPath(program: BattleProgram, targetX: number, targetY: number): string[] {
            // Generally A* uses a priority queue, but we have a low number
            // of nodes (< 100) so hopefully it's not worth the overhead
            // TODO: benchmark this. Does it affect FPS in game?
            var open = [];

            // O(n)
            var pullLowest = function() {
                var lowest = 100000;
                var best = null;
                var bestIndex = -1;
                for (var i = 0; i < open.length; i++) {
                    var current = open[i];
                    if (current.priority < lowest) {
                        best = current;
                        bestIndex = i;
                    }
                }
                open.splice(bestIndex, 1);
                console.log('open', open);
                return best;
            };

            // O(1)? (Array.push)
            var insert = function(o, priority) {
                o.priority = priority;
                open.push(o);
            };

            // O(n)
            var remove = function(o) {
                for (var i = 0; i < open.length; i++) {
                    var current = open[i];
                    if (o.x == current.x && o.y == current.y) {
                        open.splice(i, 1);
                        return;
                    }
                }
            };

            // O(n)
            var contains = function(o) {
                for (var i = 0; i < open.length; i++) {
                    var current = open[i];
                    if (o.x == current.x && o.y == current.y) {
                        return true;
                    }
                }
                return false;
            };

            var allNodes = [];
            var map = this.manager.map;

            for (var y = 0; y < map.tileHeight; y++) {
                for (var x = 0; x < map.tileWidth; x++) {
                    if (map.passable(x, y) ||
                        (x == targetX && y == targetY) ||
                        (x == program.tileX && y == program.tileY)) {
                        console.log("PUSHING", x, y)
                        allNodes.push({
                            x: x,
                            y: y,
                            g: 0,
                            closed: false,
                            parent: null,
                            priority: -1
                        });
                    }
                    else {
                        console.log("SKIPPING", x, y)
                        allNodes.push(null);
                    }
                }
            }
            var getNeighbors = function(node) {
                var offsets = [[1,0], [0,1], [-1,0], [0,-1]];
                var neighbors = [];
                for (var i = 0; i < offsets.length; i++) {
                    var offset = offsets[i];
                    var tileX = node.x + offset[0];
                    var tileY = node.y + offset[1];
                    // remove this and pathfinding wraps around
                    if (tileX < 0 || tileY < 0 || tileY >= map.tileHeight || tileX >= map.tileWidth) {
                        continue;
                    }
                    var neighbor = allNodes[map.tileWidth * tileY + tileX];
                    console.log("\tFOUND NEIGHBOR:", tileX, tileY, map.tileWidth * tileY + tileX, neighbor)
                    if (neighbor !== null && typeof neighbor !== "undefined") {
                        neighbors.push(neighbor);
                    }
                }
                return neighbors;
            };

            var h = function(node) {
                return Math.abs(node.x - targetX) + Math.abs(node.y - targetY);
            }

            open.push(allNodes[program.tileX + program.tileY * map.tileWidth]);
            console.log(program.tileX, program.tileY, program.tileX + program.tileY * map.tileWidth, open)

            var lowest = pullLowest();
            var steps = map.tileWidth * map.tileHeight;
            while (lowest.x !== targetX || lowest.y !== targetY) {
                steps--;
                // took too long
                if (steps < 0) {
                    return null;
                }
                lowest.closed = true;
                console.log("STEP:", lowest.x, lowest.y)
                var neighbors = getNeighbors(lowest);
                for (var i = 0; i < neighbors.length; i++) {
                    var neighbor = neighbors[i];

                    var cost = lowest.g + 1;
                    var neighborInOpen = contains(neighbor);
                    var neighborInClosed = neighbor.closed === true;
                    var neighborCost = neighbor.g;

                    console.log("\tNEIGHBOR:", neighbor.x, neighbor.y, neighborInOpen, neighbor.closed, cost, neighborCost)
                    if (neighborInOpen && cost < neighborCost) {
                        remove(neighbor);
                    }

                    if (neighborInClosed && cost < neighborCost) {
                        neighbor.closed = false;
                    }

                    if (!neighborInOpen && !neighborInClosed) {
                        neighbor.g = cost;
                        neighbor.parent = lowest;
                        insert(neighbor, neighbor.g + h(neighbor));
                    }
                }
                lowest = pullLowest();
            }

            var points = [];
            var node = lowest;
            while (true) {
                points.push({ x: node.x, y: node.y });
                node = node.parent;
                if (!node) break;
            }
            return points.reverse().slice(1);
        }
    }

    class ChaseStrategy extends AIStrategy {
        // Moves to nearest player program and attacks it

        runTurn() {
            this.programs.forEach(function(program) {
                var closest = this.closestPlayer(program);
                if (!closest) {
                    return;
                }
                var path = this.findPath(program, closest.tileX, closest.tileY);
                for (var i = 0; i < path.length; i++) {
                    var point = path[i];
                    var direction;
                    if (point.y > program.tileY) {
                        direction = 'down';
                    }
                    else if (point.y < program.tileY) {
                        direction = 'up';
                    }
                    else if (point.x > program.tileX) {
                        direction = 'right';
                    }
                    else if (point.x < program.tileX) {
                        direction = 'left';
                    }

                    if (program.moves == program.maxMoves) {
                        break;
                    }

                    if (this.passableDirection(program, direction)) {
                        this.move(program, direction);
                    }
                    else {
                        break;
                    }
                }

                if (this.commandInRange(program, 0, closest)) {
                    this.targetedCommand(program, 0, closest);
                }
            }, this);
        }
    }
}