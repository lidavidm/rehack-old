module NightfallHack {
    export interface BattleObject {
        x: number;
        y: number;
        tileX: number;
        tileY: number;
    }
    
    // TODO move this data into JSON
    export class BattleProgram extends Phaser.Group {
        static _connectorTextures: { [program: string]: Phaser.BitmapData; } = {};

        _state: BattleState;
        _program: ProgramInfo;
        _programTile: Phaser.Sprite;
        _healthTiles: Phaser.Group[] = [];
        _moves: number = 0;
        _hasUsedCommand: boolean = false;
        _commands = [];
        public events: Phaser.Events;
        
        constructor(state, x, y, program: ProgramInfo) {
            super(state.game, null);
            this._state = state;
            var game = state.game;
            this._program = program;
            this._programTile = new Phaser.Sprite(game, x, y, 'program_' + program.texture, 0);
            this._programTile.inputEnabled = true;
            this.events = this._programTile.events;
            this.add(this._programTile);

            if (!(program.texture in BattleProgram._connectorTextures)) {
                var connector = new Phaser.BitmapData(game, 'program_connector_' + program.texture, 6, 6);
                connector.draw('program_' + program.texture, 0, 0);
                connector.update();
                var color: any = connector.getPixelRGB(0, 0);
                connector.fill(color.r, color.g, color.b, 1);
                BattleProgram._connectorTextures[program.texture] = connector;
            }

            for (var i = 0; i < program.commands.length; i++) {
                // Create a separate command object because all programs
                // share the same command data object
                var command = {
                    name: program.commands[i].name,
                };
                if (typeof program.commands[i].handler !== "undefined") {
                    command.handler = this.createCommandHandler(program.commands[i]);
                }
                this._commands.push(command);
            }
        }

        newTurn() {
            this._moves = 0;
            this._hasUsedCommand = false;
        }

        addHealth(direction: string) {
            var xOffset = 0;
            var yOffset = 0;

            if (direction == 'up') {
                xOffset = 12;
                yOffset = -6;
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
                xOffset = -6;
                yOffset = 12;
            }

            var group = new Phaser.Group(this.game, this);
            var image = new Phaser.Image(this.game, this.x, this.y, 'program_' + this._program.texture, 1);
            group.add(image);
            var connector = new Phaser.Image(this.game, this.x + xOffset, this.y + yOffset, '', '');
            BattleProgram._connectorTextures[this._program.texture].add(connector);
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

        createCommandHandler(commandData) {
            return () => {
                this._hasUsedCommand = true;
                console.log('handling command', commandData)
                if (commandData.type == CommandType.Targeted) {
                    console.log('targeted command', this.tileX, this.tileY)
                    this._state.getCommandTarget(
                        this.tileX, this.tileY, commandData.range,
                        commandData.target,
                        (target) => {
                            commandData.handler(target, this._state);
                        },
                        () => {
                            this.hasUsedCommand = false;
                        }
                    );
                }
                else {
                    commandData.handler(this._state);
                }
            };
        }

        damage(damage: number) {
            console.log(this._program.name + ' took damage ' + damage);
            
            while (damage > 0) {
                var health = this._healthTiles.shift();
                if (typeof health !== "undefined") {
                    health.destroy();
                }
                else {
                    this._programTile.destroy();
                    this.destroy();
                    break;
                }
                damage--;
            }
        }

        passable(x: number, y: number) {
            if (x == this.tileX && y == this.tileY) {
                return false;
            }

            var health = this._healthTiles;
            for (var i = 0; i < health.length; i++) {
                // assume the tile is child 0 (based on order of addition above)
                var tile = health[i].children[0];
                var tileX = (tile.x - 1) / 34;
                var tileY = (tile.y - 1) / 34;
                if (x == tileX && y == tileY) {
                    return false;
                }
            }
            return true;
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

        get tileX(): number {
            return (this._programTile.x - 1) / 34;
        }

        get tileY(): number {
            return (this._programTile.y - 1) / 34;
        }

        get health(): number {
            return this._healthTiles.length + 1;
        }

        get moves(): number {
            return this._moves;
        }

        get hasUsedCommand(): boolean {
            return this._hasUsedCommand;
        }

        set hasUsedCommand(used: boolean) {
            this._hasUsedCommand = used;
        }

        get maxMoves(): number {
            return this._program.maxMoves;
        }

        get maxHealth(): number {
            return this._program.maxHealth;
        }

        get uiData(): UiObject {
            var commands = [{
                name: "Do Nothing",
                handler: this._state.programDoNothing.bind(this._state)
            }];
            if (!this.hasUsedCommand) {
                commands = this._commands.concat(commands);
            }
            return {
                title: this._program.name,
                health: this.health,
                maxHealth: this._program.maxHealth,
                moves: this.moves,
                maxMoves: this._program.maxMoves,
                commands: commands
            };
        }
    }
    
    export class BattleState extends Phaser.State {
        map: BattleMap;
        ai: AIManager;
        programs: Phaser.Group;
        enemies: Phaser.Group;
        state: string = 'deploy';
        selectedProgram: BattleProgram;

        tileUi: Phaser.Group;
        moveUp: Phaser.Sprite;
        moveLeft: Phaser.Sprite;
        moveRight: Phaser.Sprite;
        moveDown: Phaser.Sprite;
        selectUi: Phaser.Group;
        
        preload() {
            // TODO: move this to BattleMap somehow
            this.game.load.image('background', 'assets/textures/background.png');
            this.game.load.spritesheet('tileset1', 'assets/textures/tileset1.png', 32, 32);
            this.game.load.image('tile_selected', 'assets/textures/tile_selected.png');
            this.game.load.spritesheet('tile_move', 'assets/textures/tile_move.png', 32, 32);
            this.game.load.spritesheet('tile_targetable', 'assets/textures/tile_targetable.png', 34, 34);
            this.game.load.spritesheet('program_backdoor', 'assets/textures/program_backdoor.png', 30, 30);
            this.game.load.spritesheet('program_exploit1', 'assets/textures/program_exploit1.png', 30, 30);
            this.game.load.spritesheet('program_macafee', 'assets/textures/program_macafee.png', 30, 30);
        }

        create() {
            this.game.add.tileSprite(0, 0, 800, 600, "background");
            
            var domUi = (<Game> this.game).domUi;
            domUi.show();
            this.map = new BattleMap(this.game, null, {
                map: [0,0,0,2,0,0,0,2,
                      0,0,0,2,0,1,1,0,
                      0,0,0,0,0,0,0,0,
                      2,0,0,2,0,0,0,2],
                width: 8,
                height: 4
            });
            this.map.x = this.game.world.centerX - this.map.width / 2;
            this.game.add.existing(this.map);

            this.programs = this.game.add.group();
            this.programs.x = this.game.world.centerX - this.map.width / 2;
            this.enemies = this.game.add.group();
            this.enemies.x = this.game.world.centerX - this.map.width / 2;
            this.ai = new AIManager(this.map, this, this.enemies, this.programs);

            // TODO move highlight to this group instead
            // TODO fewer redundant groups
            this.tileUi = this.game.add.group();
            this.tileUi.x = this.game.world.centerX - this.map.width / 2;
            this.selectUi = this.game.add.group();
            this.selectUi.x = this.game.world.centerX - this.map.width / 2;

            this.map.onTileClick.add((image, x, y) => {
                domUi.objectSelected({
                    title: 'Deploy Memory Address',
                    commands: [{
                        name: 'Load Program',
                        handler: () => {
                            domUi.menu([{
                                name: "Load Backdoor",
                                tooltip: "Backdoor info/stats/skills",
                                handler: () => { this.loadProgram(Programs.Backdoor, x, y); }
                            }, {
                                name: "Load Exploit Level I",
                                handler: () => { this.loadProgram(Programs.Exploit1, x, y); }
                            }]);
                        }
                    }]
                });
            });

            domUi.onEndTurn.add(() => {
                this.endPlayerTurn();
                this.startEnemyTurn();
                this.endEnemyTurn();
                this.startPlayerTurn();
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

            this.loadEnemyProgram(Programs.MacAFee, 0, 0);
            this.loadEnemyProgram(Programs.MacAFee, 2, 0);
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

            if (this.selectedProgram.moves < this.selectedProgram.maxMoves) {
                this.showMoveControls();
            }

            (<Game> this.game).domUi.objectSelected(sprite.uiData);
        }

        showMoveControls() {
            this.tileUi.visible = true;
            this.tileUi.x = (this.game.world.centerX - this.map.width / 2) + (this.selectedProgram.x - 1);
            this.tileUi.y = this.selectedProgram.y - 1;
            var x = this.selectedProgram.tileX, y = this.selectedProgram.tileY;
            this.moveUp.visible = this.passable(x, y - 1);
            this.moveRight.visible = this.passable(x + 1, y);
            this.moveDown.visible = this.passable(x, y + 1);
            this.moveLeft.visible = this.passable(x - 1, y);
        }

        hideMoveControls() {
            this.tileUi.visible = false;
        }

        passable(x, y) {
            if (!this.map.passable(x, y)) {
                return false;
            }
            var programs = <BattleProgram[]> this.programs.children;
            for (var i = 0; i < programs.length; i ++) {
                if (!programs[i].passable(x, y)) {
                    return false;
                }
            }
            var enemies = <BattleProgram[]> this.enemies.children;
            for (var i = 0; i < enemies.length; i ++) {
                if (!enemies[i].passable(x, y)) {
                    return false;
                }
            }
            return true;
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
                this.showMoveControls();
            }

            (<Game> this.game).domUi.objectSelected(this.selectedProgram.uiData);
        }

        getCommandTarget(xCenter: number, yCenter: number, range: number,
                         targetType: CommandTargetType,
                         callback: (target: BattleProgram) => any,
                         cancel: () => any) {
            var images = [];
            
            this.hideMoveControls();

            var cleanup = () => {
                this.programClicked(this.selectedProgram);
                for (var i = 0; i < images.length; i++) {
                    images[i].destroy();
                }
            };
            var cancelHandler = () => {
                // cleanup must come after as cancel resets "hasUsedCommand"
                // flag, which determines what is shown in the menu
                cancel();
                cleanup();
            }
            (<Game> this.game).domUi.menu([{
                name: "Cancel",
                handler: cancelHandler
            }]);
            var rangeSquared = Math.pow(range, 2);
            for (var x = xCenter - range; x <= xCenter + range; x++) {
                for (var y = yCenter - range; y <= yCenter + range; y++) {
                    var distance = Math.pow(x - xCenter, 2) + Math.pow(y - yCenter, 2);
                    if (distance > rangeSquared) {
                        continue;
                    }
                    // targetType == Enemy
                    var found = false;
                    for (var i = 0; i < this.enemies.children.length; i++) {
                        if (!this.enemies.children[i].passable(x, y)) {
                            ((enemy) => {
                                var image = new Phaser.Image(this.game, x * 34, y * 34, 'tile_targetable', 0);
                                this.selectUi.add(image);
                                image.inputEnabled = true;
                                image.events.onInputUp.add(() => {
                                    cleanup();
                                    callback(enemy);
                                });
                                images.push(image);
                            })(this.enemies.children[i]);
                            
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        var image = new Phaser.Image(this.game, x * 34, y * 34, 'tile_targetable', 1);
                        this.selectUi.add(image);
                        images.push(image);
                    }
                }
            }
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

        endPlayerTurn() {
            this.objectDeselected();
            this.selectUi.removeAll(true);
            if (this.enemies.children.length == 0) {
                this.game.state.start('MainMenu');
            }
        }

        startEnemyTurn() {
            this.state = 'enemyTurn';
            this.ai.startTurn();
        }

        endEnemyTurn() {
            this.ai.endTurn();
            if (this.programs.children.length == 0) {
                this.game.state.start('MainMenu');
            }
        }

        update() {
            
        }
    }
}