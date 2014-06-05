module NightfallHack {
    // TODO move this data into JSON
    export class BattleProgram extends Phaser.Sprite {
        static _connectorTextures: { [program: string]: Phaser.BitmapData; } = {};
        static _healthTextures: { [program: string]: Phaser.BitmapData; } = {};

        _programName: string;
        _healthTiles: Phaser.Image[];
        uiData: UiObject;
        
        constructor(game, x, y, programName) {
            super(game, x, y, 'program_' + programName);
            this._programName = programName;
            this.inputEnabled = true;

            if (!(programName in BattleProgram._connectorTextures)) {
                var connector = new Phaser.BitmapData(game, 'program_connector_' + programName, 8, 4);
                connector.fill(255, 255, 255, 1);
                BattleProgram._connectorTextures[programName] = connector;

                var health = new Phaser.BitmapData(game, 'program_health_' + programName, 30, 30);
                health.fill(255, 255, 255, 1);
                BattleProgram._healthTextures[programName] = connector;
            }

            this.uiData = {
                title: programName,
                commands: [{
                    name: "Open Backdoor"
                }]
            };
        }

        addHealth() {
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
            this.game.load.image('map_bg_01', 'assets/textures/map_bg_01.png');
            this.game.load.image('map_bg_02', 'assets/textures/map_bg_02.png');
            this.game.load.image('tile_selected', 'assets/textures/tile_selected.png');
            this.game.load.spritesheet('tile_move', 'assets/textures/tile_move.png', 32, 32);
            this.game.load.image('program_backdoor', 'assets/textures/program_backdoor.png');
        }

        create() {
            this.game.add.tileSprite(0, 0, 800, 600, "background");
            
            var domUi = (<Game> this.game).domUi;
            this.map = new BattleMap(this.game, null, 'BattleMap', 16, 8);
            this.map.x = this.game.world.centerX - this.map.width / 2;
            this.game.add.existing(this.map);

            this.programs = this.game.add.group();
            this.programs.x = this.game.world.centerX - this.map.width / 2;
            
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
        }

        loadProgram(program, x, y) {
            this.objectDeselected();
            var programSprite = new BattleProgram(this.game, 1 + x * 34, 1 + y * 34, program);
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

        showMoveControls(sprite: Phaser.Sprite) {
            this.tileUi.visible = true;
            this.tileUi.x = (this.game.world.centerX - this.map.width / 2) + (sprite.x - 1);
            this.tileUi.y = sprite.y - 1;
        }

        move(direction: string) {
            if (!this.selectedProgram) return;

            this.selectedProgram.addHealth();
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
            this.showMoveControls(this.selectedProgram);
        }

        startBattle() {
            this.state = 'battle';
            this.programs.forEach(function(sprite) {
                sprite.events.onInputDown.add(() => {
                    this.programClicked(sprite);
                });
            }, this);
        }

        update() {
            
        }
    }
}