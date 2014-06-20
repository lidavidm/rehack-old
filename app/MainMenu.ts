module NightfallHack {
    export class MainMenu extends Phaser.State {
        private newGame: TextButton;
        private loadGame: TextButton;
        private normalColor = "#00AA00";

        preload() {
            this.game.load.image('menubackground', 'assets/textures/menubackground.png');
        }

        create() {
            this.game.add.tileSprite(0, 0, 800, 600, "menubackground");
            (<Game> this.game).domUi.hide();

            var style = {
                font: "64px Ubuntu Mono",
                fill: this.normalColor,
                align: "center"
            };
            var style2 = {
                font: "16px Ubuntu Mono",
                fill: this.normalColor,
                align: "center"
            };

            this.game.add.text(8, this.game.world.centerY / 8, "re/hack", style);
            this.game.add.text(8, 2 * this.game.world.centerY / 4, "A GAME", style2);

            this.newGame = new TextButton(this.game, 16, this.game.world.centerY, "New Game", style2);
            this.game.add.existing(this.newGame);
            this.loadGame = this.game.add.existing(new TextButton(this.game, 16, 5 * this.game.world.centerY / 4, "Continue", style2));

            this.newGame.onClick.add(() => {
                this.game.state.start('BattleState');
            });
        }
    }
}