module NightfallHack {
    export class BattleMap extends Phaser.Group {
        _width: number;
        _height: number;
        _highlight: Phaser.Image;
        _deployAddresses: number = 1;

        public onTileClick = new Phaser.Signal();
        
        constructor(game, parent, name, width, height) {
            super(game, parent, name);
            
            this._width = width;
            this._height = height;

            this._highlight = new Phaser.Image(game, -32, -32, 'tile_selected', '');
            this._highlight.visible = false;

            var needed = this._deployAddresses;
            var left = width * height;
            for (var w = 0; w < width; w++) {
                for (var h = 0; h < height; h++) {
                    ((w, h) => {
                        var tile = 'map_bg_01';
                        if (Math.random() < needed / left) {
                            tile = 'map_bg_02';
                            needed--;
                        }

                        var image = new Phaser.Image(game, 34 * w, 34 * h, tile, '');
                        if (tile === 'map_bg_02') {
                            image.inputEnabled = true;
                            image.events.onInputDown.add(() => {
                                this.onTileClick.dispatch(image, w, h);
                                this.highlightTile(image.x, image.y);
                            });
                        }
                        this.add(image);
                        left--;
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
                if (tile.key == 'map_bg_02' && tile.x == 34 * x && tile.y == 34 * y) {
                    this.remove(tile, true);
                    this.add(new Phaser.Image(this.game, 34 * x, 34 * y, 'map_bg_01', ''));
                    this._deployAddresses--;
                }
            }, this);
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