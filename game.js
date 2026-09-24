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
        //center of screen x and y values
        this.centerX = this.sys.game.config.width/2;
        this.centerY = this.sys.game.config.height/2;

        this.hexboard = new HexBoard();
        this.hexboard.buildHexBoard();

        this.tileList = this.hexboard.getHexTileArr();
        this.numTiles = this.tileList.length;

        for (let i = 0; i < this.numTiles; i++) {
            let tilePts = this.tileList[i].getVerticesPixels();
            //add screen offsets to pixel coords of each tile pt
            let offsetPts = tilePts.map((pt) => ({x: pt.x + this.centerX, y: pt.y + this.centerY}));
            
            this.add.graphics().fillStyle(0x00ff00).fillPoints(offsetPts);
            this.add.graphics().lineStyle(1, 0x000000).strokePoints(offsetPts);
        }
    }

    update() {
        
    }
}

function testCode() {
    let min7 = 6;
        let max7 = 6;
        let players = 2; //max 4 players
        let cardDeck = new DeckofCards(min7, max7);
        let turnCt = 0;

        cardDeck.createDeck();
        cardDeck.shuffleDeck();
        let deckLen = cardDeck.getDeckLength();

        //run deck length + 5 times, print player, card drawn, and deck length
            for (let i = 0; i < deckLen / 2 + 5; i++) {
                for (let p = 0; p < players; p++) {
                    turnCt++;
                    console.log("Turn " + turnCt + ": Player " + (p + 1) + " card drawn: " + cardDeck.takeTurn() + "\n");
                }
        }
}

const game = new Phaser.Game({
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720
    },
    scene: [GameScene], //TODO: Add menu last
    title: "NoLuckCatan",
});