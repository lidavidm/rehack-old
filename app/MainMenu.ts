module NightfallHack {
    export class MainMenu extends Phaser.State {
        private newGame: TextButton;
        private loadGame: TextButton;
        private normalColor = "#00AA00";
        
        preload() {
        }

        create() {
            var style = {
                font: "32px Consolas",
                fill: this.normalColor,
                align: "center"
            };
            var style2 = {
                font: "16px Consolas",
                fill: this.normalColor,
                align: "center"
            };
            
            this.game.add.text(8, this.game.world.centerY / 8, "Nightfall", style);
            this.game.add.text(8, this.game.world.centerY / 4, "A Game", style2);

            this.newGame = new TextButton(this.game, 16, this.game.world.centerY, "New Game", style2)
            this.game.add.existing(this.newGame);
            this.loadGame = this.game.add.existing(new TextButton(this.game, 16, 5 * this.game.world.centerY / 4, "Continue", style2));

            this.newGame.onClick.add(() => {
                this.game.state.start('TestMap');
            });
        }
    }
}