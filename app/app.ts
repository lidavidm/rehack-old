module NightfallHack {
    export class Game extends Phaser.Game {
        public domUi = new DomUi(document.getElementById('ui'));
        
        constructor() {
            super(800, 600, Phaser.AUTO, 'content', null);
            this.state.add('Boot', Boot);
            this.state.add('MainMenu', MainMenu);
            this.state.add('BattleState', BattleState);

            this.state.start('BattleState');
        }
    }
}

window.onload = () => {
    var game = new NightfallHack.Game();
};