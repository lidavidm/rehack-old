module NightfallHack {
    export interface UiObjectCommand {
        name: string;
        handler?: any;
        tooltip?: string;
    }
    
    export interface UiObject {
        title: string;
        commands: UiObjectCommand[];
    }
    
    export class DomUi {
        private _element: HTMLElement;
        private _title: HTMLElement;
        private _commandList: HTMLElement;
        private _selected: UiObject;
        private _commands: UiObjectCommand[];

        public onCommandSelected = new Phaser.Signal();
        
        constructor(element) {
            this._element = element;
            this._title = element.querySelector('h1');
            this._commandList = element.querySelector('#ui-commands ul');
        }

        objectSelected(properties: UiObject) {
            this._selected = properties;
            this._title.innerHTML = properties.title;
            this.menu(properties.commands);
        }

        objectDeselected() {
            this._selected = null;
            this._title.innerHTML = '';
            this._commandList.innerHTML = '';
        }

        menu(commands: UiObjectCommand[]) {
            this._commands = commands;
            this._commandList.innerHTML = '';
            for (var i = 0; i < commands.length; i++) {
                this._commandList.innerHTML += "<li><button>" + commands[i].name + "</button></li>";
            }

            var commandNodes = this._commandList.querySelectorAll('button');
            for (var i = 0; i < commandNodes.length; i++) {
                ((i) => {
                    commandNodes[i].addEventListener('click', (event) => {
                        this._commands[i].handler();
                    });
                })(i);
            }
        }
    }
}