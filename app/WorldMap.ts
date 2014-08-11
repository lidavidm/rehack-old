module NightfallHack {
    enum TileType {
        Blank = 1,
        ComputerEnemy,
        PathUR,
        PathRD,
        ComputerFriendly,
        ComputerUnreachable,
        PathDR,
        PathRU,
        Blank1,
        Blank2,
        PathLR,
        PathUD
    };

    export class WorldMap extends State {
        map: Phaser.Tilemap;
        layer: Phaser.TilemapLayer;
        domUi: DomUi;
        chatUi: ChatUi;
        highlight: Phaser.Image;

        preload() {
            this.game.load.image('background', 'assets/textures/background.png');
            this.game.load.tilemap('worldmap', 'assets/maps/worldmap.json', null,
                                   Phaser.Tilemap.TILED_JSON);
            this.game.load.image('worldmap_tileset', 'assets/textures/worldmap_tileset.png');
            this.game.load.image('tile_selected', 'assets/textures/tile_selected_world.png');
        }

        create() {
            this.domUi = this.game.domUi;
            this.domUi.hide();
            this.domUi.hideExtra();

            this.game.world.bounds = new Phaser.Rectangle(0, 0, 16 * 64, 16 * 64);
            this.game.camera.bounds = this.game.world.bounds;
            this.game.add.tileSprite(0, 0, 16*64, 16*64, "background");

            this.highlight = this.game.add.image(-32, -32, 'tile_selected');
            this.highlight.visible = false;

            this.map = new Phaser.Tilemap(this.game, 'worldmap');
            this.map.addTilesetImage('worldmap_tileset', 'worldmap_tileset');
            this.layer = this.map.createLayer('Tile Layer 1');
            this.layer.fixedToCamera = false;

            var layerData = <any> this.layer.layer.data;
            layerData.forEach((row, rowNo) => {
                row.forEach((tile: Phaser.Tile, columnNo: number, row: Phaser.Tile[]) => {
                    if (tile.index === TileType.ComputerUnreachable) {
                        var identifier = columnNo.toString() + ":" + rowNo.toString();
                        if (this.reachable(identifier)) {
                            row[columnNo].index = TileType.ComputerEnemy;
                        }
                        else {
                            row[columnNo].alpha = 0.9;
                        }
                    }
                });
            });

            this.game.input.mouse.mouseUpCallback = (e) => {
                var x = e.offsetX;
                var y = e.offsetY;
                var point = new Phaser.Point();
                this.layer.getTileXY(x, y, point);
                var tileType = (<any> this.layer.layer).data[point.y][point.x].index;
                this.tileClicked(point.x, point.y, tileType);
            };

            this.game.save.quests.onCreate(this, "WorldMap");
        }

        tileClicked(x: number, y: number, type: number) {
            if (type == TileType.ComputerEnemy || type == TileType.ComputerUnreachable) {
                var identifier = x.toString() + ":" + y.toString();
                var data = this.game.save.netData[identifier];
                this.domUi.show();

                this.highlight.visible = true;
                this.highlight.x = 64 * x;
                this.highlight.y = 64 * y;

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
                this.highlight.visible = false;
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