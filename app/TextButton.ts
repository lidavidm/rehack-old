module NightfallHack {
    export class TextButton extends Phaser.Text {
        private normalColor = "#00AA00";
        private highlightColor = "#00EE00";

        public onClick = new Phaser.Signal();
        
        constructor(game: Phaser.Game, x: number, y: number, text: string, style) {
            super(game, x, y, text, style);
            this.inputEnabled = true;
            this.fill = this.normalColor;

            this.events.onInputOver.add(() => {
                this.fill = this.highlightColor;
            });
            this.events.onInputOut.add(() => {
                this.fill = this.normalColor;
            });
            this.events.onInputUp.add(() => {
                this.onClick.dispatch(this);
            });
        }
    }
}