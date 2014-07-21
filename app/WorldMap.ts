module NightfallHack {
    export class WorldMap extends State {
        map: Phaser.Tilemap;
        layer: Phaser.TilemapLayer;
        domUi: DomUi;
        chatUi: ChatUi;

        preload() {
            this.game.load.image('background', 'assets/textures/background.png');
            this.game.load.tilemap('worldmap', 'assets/maps/worldmap.json', null,
                                   Phaser.Tilemap.TILED_JSON);
            this.game.load.image('worldmap_tileset', 'assets/textures/worldmap_tileset.png');
        }

        create() {
            this.domUi = this.game.domUi;
            this.chatUi = this.game.chatUi;
            this.domUi.hide();
            this.domUi.hideExtra();
            this.chatUi.setName('l33tnerd');

            this.game.world.bounds = new Phaser.Rectangle(0, 0, 16 * 64, 16 * 64);
            this.game.camera.bounds = this.game.world.bounds;
            this.game.add.tileSprite(0, 0, 16*64, 16*64, "background");

            this.map = new Phaser.Tilemap(this.game, 'worldmap');
            this.map.addTilesetImage('worldmap_tileset', 'worldmap_tileset');
            this.layer = this.map.createLayer('Tile Layer 1');
            this.layer.fixedToCamera = false;

            this.game.input.mouse.mouseUpCallback = (e) => {
                // XXX figure out why
                var x = e.x + 2*this.game.camera.x;
                var y = e.y + 2*this.game.camera.y;
                var point = new Phaser.Point();
                this.layer.getTileXY(x, y, point);
                var tileType = (<any> this.layer.layer).data[point.y][point.x].index;
                this.tileClicked(point.x, point.y, tileType);
            };
        }

        tileClicked(x: number, y: number, type: number) {
            if (type == 6) {
                var identifier = x.toString() + ":" + y.toString();
                var data = this.game.save.netData[identifier];
                this.domUi.show();

                var commands = [];
                var reachable = this.reachable(identifier);
                if (reachable) {
                    commands = [{
                        name: "Connect",
                        handler: () => {
                            // TODO make this standard cleanup (method of NightfallHack.Game)
                            this.domUi.showExtra();
                            this.game.input.mouse.mouseUpCallback = null;
                            this.game.world.bounds = new Phaser.Rectangle(0, 0, 800, 600);
                            this.game.camera.bounds = this.game.world.bounds;
                            this.game.camera.x = 0;
                            this.game.camera.y = 0;
                            this.domUi.objectDeselected();
                            this.domUi.hide();
                            this.game.state.start('BattleState', true, false, data.map);
                        }
                    }]
                }

                var title = reachable ? data.name : "<Unknown node>";
                this.domUi.objectSelected({
                    title: title,
                    commands: commands
                });
            }
            else {
                this.domUi.objectDeselected();
                this.domUi.hide();
            }
        }

        update() {
            if (this.game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
                this.game.camera.y -= 5;
            }
            if (this.game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
                this.game.camera.y += 5;
            }
            if (this.game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
                this.game.camera.x -= 5;
            }
            if (this.game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
                this.game.camera.x += 5;
            }
        }

        reachable(computer: string) {
            var current = this.game.save.netData[computer];
            return (current.owned || (current.parent ? this.game.save.netData[current.parent].owned : false));
        }
    }
}