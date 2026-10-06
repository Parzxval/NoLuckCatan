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
        this.load.path = 'assets/';
        this.load.image('card1', 'card1.png');
        this.load.image('card2', 'card2.png');
        this.load.image('card3', 'card3.png');
        this.load.image('card4', 'card4.png');
        this.load.image('card5', 'card5.png');
        this.load.image('card6', 'card6.png');
        this.load.image('card7', 'card7.png');
        this.load.image('card8', 'card8.png');
        this.load.image('card9', 'card9.png');
        this.load.image('card10', 'card10.png');
        this.load.image('card11', 'card11.png');
        this.load.image('card12', 'card12.png');
        
        this.load.image('road', 'road.png');
        this.load.image('settlement', 'settlement.png');
        this.load.image('city', 'city.png');

    }
    create() {
        //center of screen x and y values
        this.centerX = this.sys.game.config.width/2;
        this.centerY = this.sys.game.config.height/2;

        this.playerCt = 2; //TODO: create input sliders
        this.playersList = [];
        for (let i = 0; i < this.playerCt; i++) {
            let player = new Player(i + 1); //Argument assigns each player a number, 1 through i+1
            this.playersList.push(player);
        }
        
        this.min7cards = 6; //TODO: create input sliders
        this.max7cards = 6; //^
        
        this.cardDeck = new DeckofCards(this.min7cards, this.max7cards);
        
        this.hexBoard = new HexBoard();
        this.hexBoard.buildHexBoard();

        this.tileList = this.hexBoard.getHexTileArr();
        this.numTiles = this.tileList.length;

        this.tileResourceMap = new Map();
        this.calcTileResourceMap();

        this.turnCt = 0;

        this.buildingImgs = new Map();
        this.roadImgs = new Map();

        for (let i = 0; i < this.numTiles; i++) {
            let tilePts = this.tileList[i].getVerticesPixels();
            //add screen offsets to pixel coords of each tile pt
            let offsetPts = tilePts.map((pt) => ({x: pt.x + this.centerX, y: pt.y + this.centerY}));
            
            this.add.graphics().fillStyle(0x00ff00).fillPoints(offsetPts);
            this.add.graphics().lineStyle(1, 0x000000).strokePoints(offsetPts);
        }

        this.edgeList = this.hexBoard.getEdgeArr();
        
        for (let i = 0; i < this.edgeList.length; i++) {
            let edgeVertices = this.edgeList[i].getEdgeVertices();
            
            let p1 = edgeVertices[0].getVertexPixelPos();
            p1 = {x: p1.x +  this.centerX, y: p1.y + this.centerY};

            let p2 = edgeVertices[1].getVertexPixelPos();
            p2 = {x: p2.x + this.centerX, y: p2.y + this.centerY};
        }

    }

    update() {
        
    }

    calcTileResourceMap() {
        for (let i = 0; i < this.numTiles; i++) {
            let tileRollNum = this.tileList[i].getRollNum();

            if (!this.tileResourceMap.has(tileRollNum)) {
                this.tileResourceMap.set(tileRollNum, []);
            }

            this.tileResourceMap.get(tileRollNum).push(this.tileList[i]);
        }
    }

    takeTurnByPlayer() {
        this.currentCard = this.cardDeck.takeTurn();
        this.turnCt++;
        
        let playerNum = (this.turnCt - 1) % this.playerCt;
        this.player = this.playersList[playerNum]; //used by functions triggered by player actions

        this.givePlayerResources();
        
        //TODO: decide who gets click input, take click input
        /*Small icons of road, city, and settlement on bottom right of players screen. When a player selects an icon, the available
        vertices/edges that the item can be placed on is highlighted. On selection of a highlighted vertex or edge, the corresponding 
        function is triggered. There is a button to end turn.
        */
    }

    givePlayerResources() {
        let matchingHexes = this.tileResourceMap.get(this.currentCard);

        //if a 7 is drawn and matchingHexes is therefore null, no one gets resources
        if (matchingHexes == null) {
            return;
        }

        for (let i = 0; i < matchingHexes.length; i++) {
            let hexSharedVertices = matchingHexes[i].getSharedVertices();
            let resource = matchingHexes[i].getResourceType();

            for (let a = 0; a < hexSharedVertices.length; a++) {

                if (hexSharedVertices[a].getOwner() != null) {
                    //check if the player has a city, which gives 2 of each resource
                    if (hexSharedVertices[a].getHasCity()) {
                        hexSharedVertices[a].getOwner().addResource(resource, 2);
                    }
                    else {
                        hexSharedVertices[a].getOwner().addResource(resource);
                    }
                }
            }
        }

    }

    placeRoad(edge) {        
        if (this.player.getPlacementsLeft().roads == 0) {
            this.givePlacementError(5);
            return;
        }
        else if (edge.getHasRoad()) {
            this.givePlacementError(2);
            return;
        }
        else {
            edge.addRoad();
            edge.setOwner(this.player);
            this.player.addOwnedEdge(edge);

            this.player.decrementPlacementsLeft("roads");

            let edgeVertices = edge.getEdgeVertices();
            
            let p1 = edgeVertices[0].getVertexPixelPos();
            p1 = {x: p1.x +  this.centerX, y: p1.y + this.centerY};

            let p2 = edgeVertices[1].getVertexPixelPos();
            p2 = {x: p2.x + this.centerX, y: p2.y + this.centerY};

            let pAvg = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2};

            let rdImg = this.add.image(pAvg.x, pAvg.y, 'road').setRotation(Math.atan2(p2.y - p1.y, p2.x - p1.x)).setScale(0.1);
            this.roadImgs.set(edge, rdImg);
        }

        return;
    }

    placeSettlement(vertex) {
        //Check for pre-existing city or settlement
        //If it isn't preparation phase (turns 1 through (num of players * 2)), check for 2 connecting roads on vertex
        let isPrepPhase = this.turnCt <= (this.playerCt * 2);

        if (this.player.getPlacementsLeft().settlements == 0) {
            this.givePlacementError(5);
            return;
        }
        else if (vertex.getHasSettlement() || vertex.getHasCity()) {
            this.givePlacementError(1);
            return;
        }
        else if (!(isPrepPhase) && vertex.checkForTwoConnectingRoads() == false) {
            this.givePlacementError(4);
            return;
        }
        else {
            vertex.addSettlement();
            vertex.setOwner(this.player);
            this.player.addOwnedVertex(vertex);

            this.player.decrementPlacementsLeft("settlements");

            let pt = vertex.getVertexPixelPos();
            pt = {x: (pt.x + this.centerX), y: (pt.y + this.centerY)};
            let buildingImg = this.add.image(pt.x, pt.y, 'settlement').setScale(0.1);
            this.buildingImgs.set(vertex, buildingImg);
        }
        return;
    }

    placeCity(vertex) {
        if (this.player.getPlacementsLeft().cities == 0) {
            this.givePlacementError(5);
            return;
        }
        //A city directly upgrades a settlement
        if (vertex.getHasSettlement()) {
            this.buildingImgs.get(vertex).setTexture('city');
            vertex.addCity();
            vertex.setOwner(this.player);

            this.player.decrementPlacementsLeft("cities");
        }
        else {
            this.givePlacementError(3);
            return;
        }        
    }

    givePlacementError(errorNum) {
        const errorList = {
            1: "There is already a settlement or city there.",
            2: "There is already a road there.",
            3: "Settlement needed to upgrade to city.",
            4: "Two connecting roads needed to place settlement.",
            5: "Max number of resource placed"
        }
        alert(errorList[errorNum]);
        return;
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