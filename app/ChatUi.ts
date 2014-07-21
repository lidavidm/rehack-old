declare var Ractive: any;

module NightfallHack {
    export class ChatUi {
        private _element: HTMLElement;
        private _ractive: any;

        constructor(element) {
            this._element = element;
            this._ractive = new Ractive({
                el: element,
                template: '#chatUi',
                data: {}
            });
        }

        show() {
            this._ractive.el.style.display = 'block';
        }

        hide() {
            this._ractive.el.style.display = 'none';
        }

        setName(name: string) {
            this._ractive.set('name', name);
            var avatar = name.slice(0, 8);
            var blocks = this._ractive.findAll('.avatar-block');
            for (var i = 0; i < avatar.length; i++) {
                blocks[i].className = 'avatar-block char-' + avatar[i];
            }
            this._ractive.set('avatar-part-1', 'test')
        }

        options(options: string[]) {
        }

        say(text: string) {
        }
    }
}