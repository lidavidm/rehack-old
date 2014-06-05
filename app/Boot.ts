module NightfallHack {
    export class Boot extends Phaser.State {
        preload() {
        }

        create() {
            if (this.game.device.desktop) {
            }
            else {
            }

            this.game.state.start('MainMenu', true, false);
        }
    }
}