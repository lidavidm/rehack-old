module NightfallHack {
    export interface BattleMapData {
        map: number[];
        width: number;
        height: number;
    }

    export class BattleMap extends Phaser.Group {
        _map: number[];
        _width: number;
        _height: number;
        _highlight: Phaser.Image;
        _deployAddresses: number = 0;

        public onTileClick = new Phaser.Signal();
        
        constructor(game, parent, map: BattleMapData) {
            super(game, parent);

            this._map = map.map;
            this._width = map.width;
            this._height = map.height;

            this._highlight = new Phaser.Image(game, -32, -32, 'tile_selected', '');
            this._highlight.visible = false;

            for (var w = 0; w < map.width; w++) {
                for (var h = 0; h < map.height; h++) {
                    ((w, h) => {
                        var tile = map.map[h * map.width + w];
                        var image = new Phaser.Image(game, 34 * w, 34 * h, 'tileset1', tile);
                        if (tile === 1) {
                            this._deployAddresses++;
                            image.inputEnabled = true;
                            image.events.onInputDown.add(() => {
                                this.onTileClick.dispatch(image, w, h);
                                this.highlightTile(image.x, image.y);
                            });
                        }
                        this.add(image);
                    })(w, h);
                }
            }
            this.add(this._highlight);
        }

        // Expects tile coordinates
        highlightTile(x, y) {
            this._highlight.visible = true;
            this._highlight.x = x - 1;
            this._highlight.y = y - 1;
        }

        hideHighlight() {
            this._highlight.visible = false;
        }

        eraseDeployAddress(x, y) {
            this.forEach(function(tile) {
                if (tile.frame === 1 && tile.x == 34 * x && tile.y == 34 * y) {
                    this.remove(tile, true);
                    this.add(new Phaser.Image(this.game, 34 * x, 34 * y, 'tileset1', 0));
                    this._deployAddresses--;
                    this._map[y * this._width + x] = 0;
                }
            }, this);
        }

        passable(x, y) {
            if (x < 0 || y < 0 || x >= this._width || y >= this._height) {
                return false;
            }
            return this._map[y * this._width + x] == 0;
        }

        get width(): number {
            return this._width * 32 + (this._width - 1) * 2;
        }

        get height(): number {
            return this._height * 32 + (this._height - 1) * 2;
        }

        get deployAddresses(): number {
            return this._deployAddresses;
        }
    }
}