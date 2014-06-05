module NightfallHack {
    export interface BattleObject {
        x: number;
        y: number;
    }
    
    // TODO move this data into JSON
    export class BattleProgram extends Phaser.Group {
        static _connectorTextures: { [program: string]: Phaser.BitmapData; } = {};

        _state: BattleState;
        _programTile: Phaser.Sprite;
        _programName: string;
        _healthTiles: Phaser.Group[] = [];
        _moves: number = 0;
        public events: Phaser.Events;
        
        constructor(state, x, y, programName) {
            super(state.game, null);
            this._state = state;
            var game = state.game;
            this._programTile = new Phaser.Sprite(game, x, y, 'program_' + programName, 0);
            this._programTile.inputEnabled = true;
            this.events = this._programTile.events;
            this.add(this._programTile);
            
            this._programName = programName;

            if (!(programName in BattleProgram._connectorTextures)) {
                var connector = new Phaser.BitmapData(game, 'program_connector_' + programName, 6, 6);
                connector.draw('program_' + programName, 0, 0);
                connector.update();
                var color: any = connector.getPixelRGB(0, 0);
                connector.fill(color.r, color.g, color.b, 1);
                BattleProgram._connectorTextures[programName] = connector;
            }
        }

        newTurn() {
            this._moves = 0;
        }

        addHealth(direction: string) {
            var xOffset = 0;
            var yOffset = 0;

            if (direction == 'up') {
                xOffset = 12;
                yOffset = -4;
            }
            else if (direction == 'right') {
                xOffset = 28;
                yOffset = 12;
            }
            else if (direction == 'down') {
                xOffset = 12;
                yOffset = 28;
            }
            else if (direction == 'left') {
                xOffset = -4;
                yOffset = 12;
            }

            var group = new Phaser.Group(this.game, this);
            var image = new Phaser.Image(this.game, this.x, this.y, 'program_' + this._programName, 1);
            group.add(image);
            var connector = new Phaser.Image(this.game, this.x + xOffset, this.y + yOffset, '', '');
            BattleProgram._connectorTextures[this._programName].add(connector);
            group.add(connector);
            this.add(group);
            this._healthTiles.push(group);

            if (this.health > this.uiData.maxHealth) {
                this._healthTiles.shift().destroy();
            }

            this._moves += 1;

            if (this.moves > this.uiData.maxMoves) {
                throw "Out of moves";
            }
        }

        get x(): number {
            return this._programTile.x;
        }

        set x(x: number) {
            this._programTile.x = x;
        }

        get y(): number {
            return this._programTile.y;
        }

        set y(y: number) {
            this._programTile.y = y;
        }

        get health(): number {
            return this._healthTiles.length + 1;
        }

        get moves(): number {
            return this._moves;
        }

        get maxMoves(): number {
            return 3;
        }

        get uiData(): UiObject {
            return {
                title: this._programName,
                health: this.health,
                maxHealth: 5,
                moves: this.moves,
                maxMoves: this.maxMoves,
                commands: [{
                    name: "Open Backdoor"
                },{
                    name: "Do Nothing",
                    handler: this._state.programDoNothing.bind(this._state)
                }]
            };
        }
    }
    
    export class BattleState extends Phaser.State {
        map: BattleMap;
        programs: Phaser.Group;
        enemies: Phaser.Group;
        state: string = 'deploy';
        selectedProgram: BattleProgram;

        tileUi: Phaser.Group;
        moveUp: Phaser.Sprite;
        moveLeft: Phaser.Sprite;
        moveRight: Phaser.Sprite;
        moveDown: Phaser.Sprite;
        
        preload() {
            // TODO: move this to BattleMap somehow
            this.game.load.image('background', 'assets/textures/background.png');
            this.game.load.spritesheet('tileset1', 'assets/textures/tileset1.png', 32, 32);
            this.game.load.image('tile_selected', 'assets/textures/tile_selected.png');
            this.game.load.spritesheet('tile_move', 'assets/textures/tile_move.png', 32, 32);
            this.game.load.spritesheet('program_backdoor', 'assets/textures/program_backdoor.png', 30, 30);
        }

        create() {
            this.game.add.tileSprite(0, 0, 800, 600, "background");
            
            var domUi = (<Game> this.game).domUi;
            this.map = new BattleMap(this.game, null, {
                map: [0,0,0,0,0,0,0,0,
                      0,0,0,0,0,1,1,0,
                      0,0,0,0,0,0,0,0],
                width: 8,
                height: 4
            });
            this.map.x = this.game.world.centerX - this.map.width / 2;
            this.game.add.existing(this.map);

            this.programs = this.game.add.group();
            this.programs.x = this.game.world.centerX - this.map.width / 2;
            this.enemies = this.game.add.group();
            this.enemies.x = this.game.world.centerX - this.map.width / 2;

            // TODO move highlight to this group instead
            this.tileUi = this.game.add.group();
            this.tileUi.x = this.game.world.centerX - this.map.width / 2;

            this.map.onTileClick.add((image, x, y) => {
                domUi.objectSelected({
                    title: 'Deploy Memory Address',
                    commands: [{
                        name: 'Load Program',
                        handler: () => {
                            domUi.menu([{
                                name: "Load Backdoor",
                                tooltip: "Backdoor info/stats/skills",
                                handler: () => { this.loadProgram('backdoor', x, y); }
                            }, {
                                name: "Load SKExploit",
                                handler: () => { this.objectDeselected(); }
                            }]);
                        }
                    }]
                });
            });

            this.moveUp = new Phaser.Sprite(this.game, 0, -34, 'tile_move', 0);
            this.moveRight = new Phaser.Sprite(this.game, 34, 0, 'tile_move', 1);
            this.moveDown = new Phaser.Sprite(this.game, 0, 34, 'tile_move', 2);
            this.moveLeft = new Phaser.Sprite(this.game, -34, 0, 'tile_move', 3);
            this.moveUp.inputEnabled = true;
            this.moveRight.inputEnabled = true;
            this.moveDown.inputEnabled = true;
            this.moveLeft.inputEnabled = true;
            this.moveUp.events.onInputUp.add(() => { this.move('up'); });
            this.moveRight.events.onInputUp.add(() => { this.move('right'); });
            this.moveDown.events.onInputUp.add(() => { this.move('down'); });
            this.moveLeft.events.onInputUp.add(() => { this.move('left'); });
            this.tileUi.add(this.moveUp);
            this.tileUi.add(this.moveRight);
            this.tileUi.add(this.moveDown);
            this.tileUi.add(this.moveLeft);
            this.tileUi.visible = false;

            this.loadEnemyProgram('backdoor', 0, 0);
            this.loadEnemyProgram('backdoor', 2, 0);
        }

        loadProgram(program, x, y) {
            this.objectDeselected();
            var programSprite = new BattleProgram(this, 1 + x * 34, 1 + y * 34, program);
            this.programs.add(programSprite);

            this.map.eraseDeployAddress(x, y);

            if (this.map.deployAddresses <= 0) {
                (<Game> this.game).domUi.menu([{
                    name: 'Start Battle',
                    handler: () => {
                        this.objectDeselected();
                        this.startBattle();
                    }
                }]);
            }
        }

        loadEnemyProgram(program, x, y) {
            var programSprite = new BattleProgram(this, 1 + x * 34, 1 + y * 34, program);
            this.enemies.add(programSprite);
        }

        objectDeselected() {
            this.selectedProgram = null;
            (<Game> this.game).domUi.objectDeselected();
            this.map.hideHighlight();
            this.tileUi.visible = false;
        }

        programClicked(sprite: BattleProgram) {
            this.selectedProgram = sprite;
            this.map.highlightTile(sprite.x - 1, sprite.y - 1);
            this.showMoveControls(sprite);

            (<Game> this.game).domUi.objectSelected(sprite.uiData);
        }

        showMoveControls(object: BattleObject) {
            this.tileUi.visible = true;
            this.tileUi.x = (this.game.world.centerX - this.map.width / 2) + (object.x - 1);
            this.tileUi.y = object.y - 1;
        }

        hideMoveControls() {
            this.tileUi.visible = false;
        }

        move(direction: string) {
            if (!this.selectedProgram) return;

            if (this.selectedProgram.moves >= this.selectedProgram.maxMoves) {
                return;
            }

            this.selectedProgram.addHealth(direction);
            if (direction == 'up') {
                this.selectedProgram.y -= 34;
            }
            else if (direction == 'right') {
                this.selectedProgram.x += 34;
            }
            else if (direction == 'down') {
                this.selectedProgram.y += 34;
            }
            else if (direction == 'left') {
                this.selectedProgram.x -= 34;
            }
            
            this.map.highlightTile(this.selectedProgram.x - 1, this.selectedProgram.y - 1);

            if (this.selectedProgram.moves == this.selectedProgram.maxMoves) {
                this.hideMoveControls();
            }
            else {
                this.showMoveControls(this.selectedProgram);
            }

            (<Game> this.game).domUi.objectSelected(this.selectedProgram.uiData);
        }

        programDoNothing() {
            this.objectDeselected();
        }

        startBattle() {
            this.startPlayerTurn();
        }

        startPlayerTurn() {
            this.state = 'playerTurn';
            this.programs.forEach(function(sprite) {
                sprite.newTurn();
                sprite.events.onInputDown.add(() => {
                    this.programClicked(sprite);
                });
            }, this);
        }

        update() {
            
        }
    }
}