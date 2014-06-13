declare var Ractive: any;

module NightfallHack {
    export interface UiObjectCommand {
        name: string;
        handler?: any;
        tooltip?: string;
    }

    export interface UiObject {
        title: string;
        commands: UiObjectCommand[];
        health?: number;
        maxHealth?: number;
        moves?: number;
        maxMoves?: number;
    }

    // TODO: add a "command log" that shows which programs used what
    // commands and how much damage was dealt
    export class DomUi {
        private _element: HTMLElement;
        private _selected: UiObject;
        private _commands: UiObjectCommand[];
        private _ractive: any;

        public onCommandSelected = new Phaser.Signal();
        public onEndTurn = new Phaser.Signal();

        constructor(element) {
            this._element = element;
            this._ractive = new Ractive({
                el: element,
                template: '#domUi',
                data: {}
            });

            this._ractive.on('command', (e) => {
                console.log(e.context);
                if (typeof e.context.handler !== "undefined") {
                    e.context.handler();
                }
            });

            this._ractive.on('end-turn', (e) => {
                this.onEndTurn.dispatch();
            });
        }

        show() {
            this._ractive.el.style.display = 'block';
        }

        hide() {
            this._ractive.el.style.display = 'none';
        }

        showExtra() {
            this._ractive.el.classList.remove('without-extra');
        }

        hideExtra() {
            this._ractive.el.classList.add('without-extra');
        }

        objectSelected(properties: UiObject) {
            this._selected = properties;
            this._ractive.set(properties);
        }

        objectDeselected() {
            this._selected = null;
            this._ractive.reset({
                title: '',
                commands: [],
            });
        }

        menu(commands: UiObjectCommand[]) {
            this._commands = commands;
            this._ractive.set('commands', commands);
        }
    }
}