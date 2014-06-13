module NightfallHack {
    export class WorldMap extends Phaser.State {
        map: Phaser.Tilemap;
        layer: Phaser.TilemapLayer;
        domUi: DomUi;

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
                var point = new Phaser.Point();
                this.layer.getTileXY(e.x, e.y, point);
                var tileType = this.layer.layer.data[point.y][point.x].index;
                this.tileClicked(tileType);
            };
        }

        tileClicked(type: number) {
            if (type == 6) {
                this.domUi.show();
                this.domUi.objectSelected({
                    title: "Enemy Computer",
                    commands: [{
                        name: "Connect"
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