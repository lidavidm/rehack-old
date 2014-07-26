declare var Ractive: any;

module NightfallHack {
    interface Message {
        npc?: boolean;
        player?: boolean;
        text: string;
    }

    export interface ChatDigraph {
        [name: string]: ChatNode;
    }

    export interface ChatNode {
        npc: string[];
        choices: {
            [option: string]: string;
        };
    }

    export class ChatUi {
        private _element: HTMLElement;
        private _ractive: any;
        private _messages: Message[] = [];

        public onOption = new Phaser.Signal();

        constructor(element) {
            this._element = element;
            this._ractive = new Ractive({
                el: element,
                template: '#chatUi',
                data: {
                    name: '',
                    messages: this._messages,
                    choices: []
                }
            });

            this._ractive.on('choice', (event) => {
                var choice = event.context;
                this._messages.push({ player: true, text: choice });
                var el = this._ractive.find('#ui-dialogue-entries');
                el.scrollTop = el.scrollHeight;
                this.options([]);
                this.onOption.dispatch(choice);
            });
        }

        show() {
            var el = this._ractive.el;
            el.style.display = 'block';
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
        }

        options(options: string[]) {
            this._ractive.set('choices', options);
        }

        say(text: string) {
            this._messages.push({ npc: true, text: text });
            var el = this._ractive.find('#ui-dialogue-entries');
            el.scrollTop = el.scrollHeight;
        }

        digraph(nodes: ChatDigraph, start: string) {
            return new Promise((fulfill, reject) => {
                var step = (current) => {
                    var offset = Math.floor(300*Math.random());
                    current.npc.forEach((choice) => {
                        var max = (50 * choice.length);
                        var delay = 500 + Math.floor(max*Math.random());
                        offset += delay;
                        setTimeout(() => {
                            this.say(choice);
                        }, offset);
                    });

                    setTimeout(() => {
                        this.options(Object.keys(current.choices));
                    }, offset + 500);

                    this.onOption.addOnce((choice) => {
                        var next = current.choices[choice];

                        if (nodes[next]) {
                            step(nodes[next]);
                        }
                        else {
                            fulfill(next);
                        }
                    });
                };

                step(nodes[start]);
            });
        }
    }
}