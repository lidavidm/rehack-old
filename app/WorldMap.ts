module NightfallHack {
    export class WorldMap extends Phaser.State {
        map: Phaser.Tilemap;
        layer: Phaser.TilemapLayer;
        domUi: DomUi;

        // TODO move this into JSON
        netData: any = {
            "1:1": {
                name: "Home PC",
                owned: true,
                parent: null
            },
            "4:1": {
                name: "Enemy PC #1",
                owned: false,
                parent: "1:1"
            },
            "6:2": {
                name: "Enemy PC #2",
                owned: false,
                parent: "4:1"
            },
            "1:4": {
                name: "Enemy PC #3",
                owned: false,
                parent: "6:2"
            },
            "6:6": {
                name: "Enemy PC #4",
                owned: false,
                parent: "4:1"
            },
            "2:6": {
                name: "Enemy PC #5",
                owned: false,
                parent: "1:4"
            }
        };

        preload() {
            this.game.load.image('background', 'assets/textures/background.png');
            this.game.load.tilemap('worldmap', 'assets/maps/worldmap.json', null,
                                   Phaser.Tilemap.TILED_JSON);
            this.game.load.image('worldmap_tileset', 'assets/textures/worldmap_tileset.png');
        }

        create() {
            this.domUi = (<Game> this.game).domUi;
            this.domUi.hide();
            this.domUi.hideExtra();
            this.game.world.bounds = new Phaser.Rectangle(0, 0, 16 * 64, 16 * 64);
            this.game.camera.bounds = this.game.world.bounds;
            this.game.add.tileSprite(0, 0, 16*64, 16*64, "background");

            this.map = new Phaser.Tilemap(this.game, 'worldmap');
            this.map.addTilesetImage('worldmap_tileset', 'worldmap_tileset');
            this.layer = this.map.createLayer('Tile Layer 1');
            this.layer.fixedToCamera = false;

            this.game.input.mouse.mouseUpCallback = (e) => {
                console.log(e.x, this.game.camera.x, e.y, this.game.camera.y)
                // XXX figure out why
                var x = e.x + 2*this.game.camera.x;
                var y = e.y + 2*this.game.camera.y;
                var point = new Phaser.Point();
                this.layer.getTileXY(x, y, point);
                var tileType = this.layer.layer.data[point.y][point.x].index;
                this.tileClicked(point.x, point.y, tileType);
            };
        }

        tileClicked(x: number, y: number, type: number) {
            if (type == 6) {
                var data = this.netData[x.toString() + ":" + y.toString()];
                this.domUi.show();
                this.domUi.objectSelected({
                    title: data.name,
                    commands: [{
                        name: "Connect",
                        handler: () => {
                            this.domUi.showExtra();
                            this.game.input.mouse.mouseUpCallback = null;
                            this.game.world.bounds = new Phaser.Rectangle(0, 0, 800, 600);
                            this.game.camera.bounds = this.game.world.bounds;
                            this.game.camera.x = 0;
                            this.game.camera.y = 0;
                            this.game.state.start('BattleState');
                        }
                    }]
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
    }
}