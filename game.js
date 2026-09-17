class Menu extends Phaser.Scene {
    constructor() {
        super('menu');
    }
    preload() {

    }
    create() {

    }
    update() {
        
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('gameScene');
    }
    preload() {

    }
    create() {
        let min7 = 6;
        let max7 = 6;
        let players = 2; //max 4 players
        let cardDeck = new DeckofCards(min7, max7);
        let decksArr = [];
        
        for (let i = 0; i < players; i++) {
            //The same card deck is copied and used since all players should have the same # of 7 cards
            //1 deck per player is shuffled differently and then pushed into an array
            let tempArr = Array.from(decksArr).shuffleDeck();
            decksArr.push(tempArr);
        }

        //run deck length + 5 times, print player, card drawn, and deck length
        console.log(decksArr + "\n");
        let deckLen = cardDeck.getDeckLength();
        
        for (let i = 0; i < deckLen + 5; i++) {
            for (let p = 0; p < players; p++) {
                console.log("Player " + p + " card drawn: " + decksArr[p].takeTurn() + "\n");
            }
        }

        
    }
    update() {
        
    }
}

const game = new Phaser.Game({
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1730,
        height: 1080
    },
    scene: [GameScene], //TODO: Add menu last
    title: "NoLuckCatan",
});