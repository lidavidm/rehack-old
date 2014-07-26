module NightfallHack {
    export class QuestManager {
        public quests: Quest[] = [];

        onCreate(state: State, name: string) {
            this.quests.forEach((quest) => {
                quest.onCreate(state, name);
            });
        }

        add(quest: Quest) {
            this.quests.push(quest);
        }
    }

    export class Quest {
        public game: Game;

        constructor(game: Game) {
            this.game = game;
        }

        onCreate(state: State, name: string) {
        }
    }

    export class IntroQuest extends Quest {
        public chatUi: ChatUi;

        constructor(game: Game) {
            super(game);
            this.chatUi = this.game.chatUi;
        }

        onCreate(state: State, name: string) {
            if (name === "WorldMap") {
                this.chatUi.setName('l33tnerd');
                this.chatUi.digraph({
                    start: {
                        npc: ['I got a job for you', 'Interested?'],
                        choices: {
                            'Sure, whatcha got?': 'accept',
                            'What kind of job?': 'details',
                            "What's in it for me?": 'reward'
                        }
                    },
                    accept: {
                        npc: ['Good.',
                              'You see that purple computer?',
                              'I need you to break in.',
                              'Get me a file.'],
                        choices: {
                            'What kind of file?': 'details',
                            'What do I get?': 'reward'
                        }
                    },
                    details: {
                        npc: [
                            "Get me a file from the S.I. computer there.",
                            "Nothing difficult. S.I. don't do cybersecurity.",
                            "I'll give you your choice of software to do it."
                        ],
                        choices: {
                            'Why me?': 'justification',
                            "Let's do this. What software you got?": 'pick'
                        }
                    },
                    justification: {
                        npc: [
                            "Let's be honest here",
                            "You're new. Disposable.",
                            "But I need someone. You botch this, I find another script kiddie.",
                            "You succeed, you got yourself some business.",
                            "K?"
                        ],
                        choices: {
                            'K.': 'reward',
                            'Alright...': 'reward'
                        }
                    },
                    reward: {
                        npc: [
                            "You'll get 1 netcoin. Enough to buy you some serious software."
                        ],
                        choices: {
                            "Let's do this. What software you got?": 'pick'
                        }
                    },
                    pick: {
                        npc: [
                            "Three choices.",
                            "2MetaSuite. Three programs.",
                            "Good ol' netmap.",
                            "Or I can give you the VW503 exploit that just landed.",
                            "What's your choice?"
                        ],
                        choices: {
                            "2Meta.": 'scriptkiddie',
                            "netmap.": 'oldschool',
                            "The exploit.": 'exploitmaster'
                        }
                    }
                }, 'start').then((choice) => {
                    console.log('Convo ended', choice);
                    this.chatUi.hide();
                });
            }
        }
    }
}