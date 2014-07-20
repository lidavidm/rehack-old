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
    }
}