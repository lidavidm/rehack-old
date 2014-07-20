///<reference path="../phaser.d.ts"/>

module NightfallHack {
    export class Game extends Phaser.Game {
        public domUi = new DomUi(document.getElementById('ui'));
        public chatUi = new ChatUi(document.getElementById('ui-chat'));
        public save = new SaveGame("Saved Game 01");

        constructor() {
            super(800, 600, Phaser.AUTO, 'content', null);
            this.state.add('Boot', Boot);
            this.state.add('MainMenu', MainMenu);
            this.state.add('WorldMap', WorldMap);
            this.state.add('BattleState', BattleState);
            this.state.add('AfterBattle', AfterBattle);

            this.state.start('WorldMap');
        }
    }
}

window.onload = () => {
    var game = new NightfallHack.Game();
};