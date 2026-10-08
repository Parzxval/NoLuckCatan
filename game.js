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
        
        this.load.image('Road', 'road.png');
        this.load.image('Settlement', 'settlement.png');
        this.load.image('City', 'city.png');

        this.load.image('Ore', 'ore.png');
        this.load.image('Brick', 'brick.png');
        this.load.image('Wool', 'sheep.png');
        this.load.image('Wheat', 'wheat.png');
        this.load.image('Wood', 'wood.png');

    }
    create() {
        //center of screen x and y values
        this.centerX = this.sys.game.config.width/2;
        this.centerY = this.sys.game.config.height/2;
        //Screen width and height
        this.width = this.sys.game.config.width;
        this.height = this.sys.game.config.height;

        this.createPlayers();
        
        this.min7cards = 6; //TODO: create input sliders
        this.max7cards = 6; //^
        
        this.cardDeck = new DeckofCards(this.min7cards, this.max7cards);
        
        this.hexBoard = new HexBoard();
        this.hexBoard.buildHexBoard();

        this.turnCt = 0;

        this.selectedItem = null;

        this.buildingImgs = new Map();
        this.roadImgs = new Map();

        this.playerTurnText = this.add.text(70, 50, "").setDepth(1);
        this.selectedItemText = this.add.text(70, 100, "").setDepth(1);
        this.resourceRolledText = this.add.text(70, this.height - 100, "").setDepth(1);

        this.drawHexTiles();
        this.calcTileResourceMap();
        this.drawIcons();
        this.createClickableVertices();
        this.createClickableEdges();

        //end turn button
        this.add.text(this.width - 100, this.height - 50, "End Turn").setDepth(1);
        this.endTurnButton = this.add.rectangle(this.width - 60, this.height - 43, 90, 20, 0x00ff00).setInteractive().on('pointerdown', () => {
            this.takeTurnByPlayer();
        })

        this.takeTurnByPlayer();
    }

    update() {
        
    }

    createPlayers() {
        this.playerCt = 2; //TODO: create input sliders
        this.playersList = [];
        for (let i = 0; i < this.playerCt; i++) {
            let player = new Player(i + 1); //Argument assigns each player a number, 1 through i+1
            this.playersList.push(player);
        }
    }

    drawHexTiles() {
        this.tileList = this.hexBoard.getHexTileArr();
        this.numTiles = this.tileList.length;
        this.resourceImageList = [];

        for (let i = 0; i < this.numTiles; i++) {
            let tilePts = this.tileList[i].getVerticesPixels();
            let tileCoords = this.tileList[i].getPixelPos();
            //add screen offsets to pixel coords of each tile pt
            tilePts = tilePts.map((pt) => ({x: pt.x + this.centerX, y: pt.y + this.centerY}));
            
            this.add.graphics().fillStyle(0xc0bfdb).fillPoints(tilePts);
            this.add.graphics().lineStyle(1, 0x000000).strokePoints(tilePts);

            //add resource image on hextile
            let img = this.add.image(tileCoords.x, tileCoords.y);
        }
    }

    drawIcons() {
        this.iconZones = new Map();
        let imgs = ['Road', 'Settlement', 'City'];
        
        for (let i = 0; i < imgs.length; i++) {
            let icon = this.add.rectangle(0, 0, 30, 30, 0x00ff00).enableFilters().setInteractive().on('pointerdown', () => {
                this.selectItem(imgs[i]) 
            });

            let img = this.add.image(0, 0, imgs[i]).setScale(0.02).setDepth(2);
            let container =  this.add.container(this.width - 150 - (50 * i), this.height - 50, [icon, img]);

            this.iconZones.set(imgs[i], {"icon" : icon, "img" : img});
        }
    }

    createClickableVertices() {
        this.vertexList = this.hexBoard.getVertexArr();
        this.vertexClickZones = new Map();

        for (let i = 0; i < this.vertexList.length; i++) {
            let vertexPts = this.vertexList[i].getVertexPixelPos();
            vertexPts = {x: vertexPts.x + this.centerX, y: vertexPts.y + this.centerY};

            let dot = this.add.graphics().fillStyle(0xff0000).fillCircle(vertexPts.x, vertexPts.y, 6).setVisible(false);
            let zone = this.add.zone(vertexPts.x, vertexPts.y, 20, 20).setInteractive().on('pointerdown', () => {
                if (this.selectedItem === 'Settlement') {
                    this.placeSettlement(this.vertexList[i]);
                }
                else if (this.selectedItem === 'City') {
                    this.placeCity(this.vertexList[i]);
                }
            })
            zone.disableInteractive();
            this.vertexClickZones.set(this.vertexList[i], {"dot": dot, "zone": zone});
        }
    }

    createClickableEdges() {
        this.edgeList = this.hexBoard.getEdgeArr();
        this.edgeClickZones = new Map();

        for (let i = 0; i < this.edgeList.length; i++) {           
            let edgeVertices = this.edgeList[i].getEdgeVertices();

            let p1 = edgeVertices[0].getVertexPixelPos();
            p1 = {x: p1.x +  this.centerX, y: p1.y + this.centerY};

            let p2 = edgeVertices[1].getVertexPixelPos();
            p2 = {x: p2.x + this.centerX, y: p2.y + this.centerY};

            let pAvg = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2};

            let dot = this.add.graphics().fillStyle(0x000000).fillCircle(pAvg.x, pAvg.y, 6).setVisible(false);
            let zone = this.add.zone(pAvg.x, pAvg.y, 20, 20). setInteractive().on('pointerdown', () => {
                this.placeRoad(this.edgeList[i]);
            })
            zone.disableInteractive();
            this.edgeClickZones.set(this.edgeList[i], {"dot": dot, "zone": zone});
        }
    }

    selectItem(item) {
        this.selectedItem = item;
        this.selectedItemText.setText(`Selected item: ${this.selectedItem}`);

        if (this.selectedItem === 'City' || this.selectedItem === 'Settlement') {
            this.showZones(this.vertexClickZones, this.edgeClickZones);
        }
        else if (this.selectedItem === 'Road') {
            this.showZones(this.edgeClickZones, this.vertexClickZones);
        }
        else if (this.selectedItem === null) {
            this.showZones(this.vertexClickZones, this.edgeClickZones, true);
        }

        this.outlineIcon();
    }

    showZones(showMap, hideMap, hideBoth = false) {
        if (hideBoth === false) {
            hideMap.forEach(val => {val.dot.setVisible(false); val.zone.disableInteractive()});
            showMap.forEach(val => {val.dot.setVisible(true); val.zone.setInteractive()});
        }
        else {
            hideMap.forEach(val => {val.dot.setVisible(false); val.zone.disableInteractive()});
            showMap.forEach(val => {val.dot.setVisible(false); val.zone.disableInteractive()});
        }
    }

    outlineIcon() {
        //create glow around icon rectangles when selected, remove glow from prev. selected
        //if selectedItem is null, remove glow from all icons
        this.iconZones.forEach((pair, name) => {if (name === this.selectedItem) {
            pair.glow = pair.icon.filters.external.addGlow(0x000000, 1, 1);
        } else {
            pair.icon.filters.external.remove(pair.glow);
        }});
        return;
    }

    setIconsEnabled(step) {
       if (step !== null) {
            this.iconZones.forEach((pair, name) => {if (name !== step) {
                pair.icon.setFillStyle(0x47634a).disableInteractive()} else {
                    pair.icon.setFillStyle(0x00ff00).setInteractive()
                }});
        }
        else {
            this.iconZones.forEach((pair) => {pair.icon.setFillStyle(0x00ff00).setInteractive()});   
        }
    }

    calcTileResourceMap() {
        this.tileResourceMap = new Map();

        for (let i = 0; i < this.numTiles; i++) {
            let tileRollNum = this.tileList[i].getRollNum();

            if (!this.tileResourceMap.has(tileRollNum)) {
                this.tileResourceMap.set(tileRollNum, []);
            }

            this.tileResourceMap.get(tileRollNum).push(this.tileList[i]);
        }
    }

    takeTurnByPlayer() {    
        this.turnCt++;
        this.isPrepPhase = this.turnCt <= (this.playerCt * 2);

        if (this.isPrepPhase) {
            //Each player places one settlement followed by one connected road on an adjacent edge
            //Once the last player does this, they get to start the second pass until the first player is reached
            //the 2nd settlement placed during prep phase doesnt need to be adjacent to anything
            this.prepPhase();
        }
        else {
            this.setEndTurnButton(true);
            this.setIconsEnabled(null);         
            this.currentCard = this.cardDeck.takeTurn();
            this.givePlayerResources();
        }
        
        this.player = this.playersList[this.getCurrentPlayerNum()]; //used by functions triggered by player actions
        

        this.playerTurnText.setText(`Turn: ${this.turnCt} \nPlayer ${this.player.getPlayerNum()}`);

        if (this.player.getPlayerVictoryPts() >= 10) {
            this.registry.set('winner', this.player);
            this.scene.start('victoryScene');
        }
    }

    prepPhase() {
        this.setEndTurnButton(false);
        this.prepStep = 'Settlement';
        this.selectItem(this.prepStep);
        this.setIconsEnabled(this.prepStep);
    }

    setEndTurnButton(bool) {
        if (bool) {
            this.endTurnButton.setFillStyle(0x00ff00).setInteractive();
        }
        else {
            this.endTurnButton.setFillStyle(0x47634a).disableInteractive();
        }
    }

    getCurrentPlayerNum() {
        if (this.turnCt <= this.playerCt) {
            return this.turnCt - 1;
        }
        else if (this.turnCt <= this.playerCt * 2) {
            return this.playerCt * 2 - this.turnCt;
        }
        else {
            return (this.turnCt - 1) % this.playerCt;
        }
    }

    givePlayerResources() {
        let matchingHexes = this.tileResourceMap.get(this.currentCard);
        let playerResourceMap = new Map();

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
                        playerResourceMap.set(hexSharedVertices[a].getOwner(), [resource, 2]);
                    }
                    else {
                        hexSharedVertices[a].getOwner().addResource(resource);
                        playerResourceMap.set(hexSharedVertices[a].getOwner(), [resource, 1]);
                    }
                }
            }

            this.updateResourceRolledText(playerResourceMap);
        }

        return;
    }

    updateResourceRolledText(map) {
        map.forEach((pair, owner) => {
            this.resourceRolledText.setText(`${pair[1]} ${pair[0]} given to player ${owner.getPlayerNum()}\n`)});
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
        else if (this.roadPlacementCheck(edge)) {
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

            let rdImg = this.add.image(pAvg.x, pAvg.y, 'Road').setRotation(Math.atan2(p2.y - p1.y, p2.x - p1.x) + Math.PI / 2).setScale(0.08).enableFilters();
            rdImg.filters.external.addGlow(playerColors[this.player.getPlayerNum()], 1, 1);
            this.roadImgs.set(edge, rdImg);

            if (this.isPrepPhase) {
                this.prepStep = null;
                this.selectItem(this.prepStep);
                this.setIconsEnabled(this.prepStep);
                this.outlineIcon();
                this.takeTurnByPlayer();
            }
        }

        return;
    }

    placeSettlement(vertex) {
        //Check for pre-existing city or settlement
        //If it isn't preparation phase (turns 1 through (num of players * 2)), check for 2 connecting roads on vertex
        if (this.player.getPlacementsLeft().settlements == 0) {
            this.givePlacementError(5);
            return;
        }
        else if (vertex.getHasSettlement() || vertex.getHasCity()) {
            this.givePlacementError(1);
            return;
        }
        else if (!this.settlementPlacementCheck(vertex)) {
            return;
        }
        else {
            vertex.addSettlement();
            vertex.setOwner(this.player);
            this.player.addOwnedVertex(vertex);

            this.player.decrementPlacementsLeft("settlements");
            this.player.addVictoryPt();

            let pt = vertex.getVertexPixelPos();
            pt = {x: (pt.x + this.centerX), y: (pt.y + this.centerY)};
            let buildingImg = this.add.image(pt.x, pt.y, 'Settlement').setScale(0.04).setDepth(1).enableFilters();
            buildingImg.filters.external.addGlow(playerColors[this.player.getPlayerNum()], 1, 1);
            this.buildingImgs.set(vertex, buildingImg);

            //Road must be placed after settlement in preparation turns
            if (this.isPrepPhase) {
                this.prepStep = 'Road';
                this.selectItem(this.prepStep);
                this.setIconsEnabled(this.prepStep);
            }
        }
        return;
    }

    placeCity(vertex) {
        if (this.player.getPlacementsLeft().cities == 0) {
            this.givePlacementError(5);
            return;
        }
        //Settlement needed to upgrade to city
        else if (!vertex.getHasSettlement()) {
            this.givePlacementError(3);
            return;
        }
        else if (vertex.getOwner() !== this.player) {
            this.givePlacementError(1);
            return;
        }
        //City directly upgrades the settlement on the same vertex
        else if (vertex.getHasSettlement()) {
            this.buildingImgs.get(vertex).setTexture('City');
            vertex.addCity();
            vertex.setOwner(this.player);
            
            this.player.decrementPlacementsLeft("cities");
            this.player.addVictoryPt();
        }

        return;
    }
    
    settlementPlacementCheck(vertex) {
        let neighborEdges = vertex.getVertexEdges();
        let hasOwnRoad = false; //check if any edge touching current vertex has a road

        for (let i = 0; i < neighborEdges.length; i++) {
            //get shared edges by vertex, then get the corresponding vertex that isn't this vertex
            let neighborVertex = neighborEdges[i].getEdgeVertices().find(v => v !== vertex);

            if (neighborVertex.getHasCity() || neighborVertex.getHasSettlement()) {
                this.givePlacementError(6);
                return;
            }
            else if (neighborEdges[i].getHasRoad() && neighborEdges[i].getOwner() === this.player){
                hasOwnRoad = true;
            }
        }

        if (hasOwnRoad || this.isPrepPhase) {
            return true;
        }
        else {
            this.givePlacementError(7);
            return;
        }
    }

    roadPlacementCheck(edge) {
        let edgeVertices = edge.getEdgeVertices();
        let hasOwnItem = false;

        for (let i = 0; i < 2; i++) {
            let vertexEdges = edgeVertices[i].getVertexEdges();

            if (edgeVertices[i].getOwner() === this.player) {
                hasOwnItem = true;
            }            
            for (let a = 0; a < vertexEdges.length; a++) {
                if (vertexEdges[a].getOwner() === this.player) {
                    hasOwnItem = true;
                }
            }
        }

        if (hasOwnItem || this.isPrepPhase) {
            return true;
        }
        else {
            this.givePlacementError(7);
            return;
        }
    }

    givePlacementError(errorNum) {
        const errorList = {
            1: "There is already a settlement or city there.",
            2: "There is already a road there.",
            3: "Own settlement needed to upgrade to city.",
            4: "Two own connecting roads needed to place settlement.",
            5: "Max number of building type placed.",
            6: "Placement too close to existing building.",
            7: "Build own connecting road first."
        }
        alert(errorList[errorNum]);
        return;
    }
}

class VictoryScene extends Phaser.Scene {
    constructor() {
        super('victoryScene');
    }

    preload() {

    }

    create() {

    }

    update() {

    }
}

const game = new Phaser.Game({
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
    },
    backgroundColor: '#90b38d',
    scene: [GameScene, VictoryScene], //TODO: Add Menu and victoryScene last
    title: "NoLuckCatan",
});