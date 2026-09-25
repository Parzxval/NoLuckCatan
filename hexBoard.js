class HexTile {
    constructor(axialCoords, terrain, hasRobber = false, size) {
        this.axialCoords = axialCoords;
        this.terrain = terrain;
        this.hasRobber = hasRobber;
        this.size = size;        
        
        this.pixelPos = this.getHexToPixel();
        this.verticesPixels = this.calcVerticesPixelPos();
        this.sharedVertices = [];
        this.sharedEdges = [];
        this.rollNum = terrain == "Desert" ? 0 : null; 
        this.isRed = false; //6 and 8 valued tiles are marked as red, so they can't be placed next to each other (too OP)
    }

    //Conversion logic credit (for pointy-top hex to pixel): Red Blob Games - https://www.redblobgames.com/grids/hexagons/
    getHexToPixel() {
        let x = this.size * (Math.sqrt(3) * this.axialCoords[0] + Math.sqrt(3)/2 * this.axialCoords[1]);
        let y = this.size * (3/2 * this.axialCoords[1]);
        
        return [x, y];
    }

    calcVerticesPixelPos() {
        let vertPixArr = [];

        for (let i = 0; i < 6; i++) {
            //angle = 60deg times i - 30 deg -> convert to radians -> x = pixelPos X value + size * cos(angle), y = pixelPos Y value + size * sin(angle)
            let angle = 60 * i - 30;
            let rad = angle * Math.PI / 180;

            let x = this.pixelPos[0] + this.size * Math.cos(rad);
            let y = this.pixelPos[1] + this.size * Math.sin(rad);

            vertPixArr.push({x, y});
        }

        return vertPixArr;
    }

    addSharedVertex(vertex) {
        this.sharedVertices.push(vertex);
    }

    addSharedEdge(edge) {
        this.sharedEdges.push(edge);
    }

    addRobber() {
        this.hasRobber = true;
    }

    removeRobber() {
        this.hasRobber = false;
    }

    setAsRed() {
        this.isRed = true;
    }

    getIsRed() {
        return this.isRed;
    }

    setRollNum(num) {
        this.rollNum = num;

        if(this.rollNum == 6 || this.rollNum == 8) {
            this.setAsRed();
        }
    }

    getRobber() {
        return this.hasRobber;
    }

    getTerrain() {
        return this.terrain;
    }

    getAxialCoords() {
        return this.axialCoords;
    }

    getPixelPos() {
        return this.pixelPos;
    }

    getVerticesPixels() {
        return this.verticesPixels;
    }

    getSharedEdges() {
        return this.sharedEdges;
    }

}

class Vertex {
    constructor(hasPort) {
        this.hasSettlement = false;
        this.hasCity = false;
        this.hasPort = hasPort;
    }

    checkForSettlement() {
        return this.hasSettlement;
    }

    checkForCity() {
        return this.hasCity;
    }

    checkForPort() {
        return this.hasPort;
    }

    addSettlement() {
        if (this.hasCity == false && this.hasSettlement == false) {
            this.hasSettlement = true;
        }
    }

    addCity() {
        if (this.hasCity == false && this.hasSettlement == true) {
            this.hasSettlement = false;
            this.hasCity = true;
        }
    }
    //Can't remove city or settlement
}

class Edge {
    constructor(sharedHexes) {
        this.sharedHexes = sharedHexes; //array of length 1 or 2
        this.vertices = [];
        this.hasRoad = false;
    }

    addRoad() {
        this.hasRoad = true;
    }

    getSharedHexes() {
        return this.sharedHexes;
    }
}

//MAYBE: Add functionality for larger boards or custom boards (maybe with JSON?) ;P
class HexBoard {
    /**
     * Builds a symmetric (for now) 19 hex-tiled hexboard with a radius of 2.
     * 
     * @param {number} - Radius of hexboard, cannot be under 2, defaults to 2.
     * 
     * User-defined hexRadius param is redundant as of now; program will not take user input until added in the future.
     */
    constructor(hexRadius = 2, size = 60) {
            this.hexRadius = hexRadius < 2 ? 2 : hexRadius; //hexRadius cannot be under 2, otherwise assigns to 2.
            this.size = size;
            this.hexTileArr = [];
            this.edgeArray = [];
            this.vertexArray = [];
            this.terrains = [];
            this.rollNums = [];

            //Fills in terrains and rollNums arrs
            this.terrainDistribution();
            this.rollNumDistribution();
     }

    terrainDistribution() {
        for (let i = 1; i < this.hexRadius; i++) {
            //1 desert, 3 mountains (ore), 3 hills (brick), 4 fields (wheat), 4 pastures (wool), 4 forests (lumber) for each hexRadius unit
            this.terrains.push("Desert", "Mountain", "Mountain", "Mountain", "Hill", "Hill", "Hill", "Field", "Field", "Field", "Field", "Pasture", "Pasture", "Pasture", "Pasture", "Forest", "Forest", "Forest", "Forest");                    
        }

        Phaser.Utils.Array.Shuffle(this.terrains);
    }

    rollNumDistribution() {
        this.redRollNums = [];
         
        for (let i = 1; i < this.hexRadius; i++) {
            //2×1, 3×2, 4×2, 5×2, 6×2, 8×2, 9×2, 10×2, 11×2, 12×1 per hexRad unit
            this.rollNums.push(2, 3, 3, 4, 4, 5, 5, 9, 9, 10, 10, 11, 11, 12);
            //Red numbers stay in a helper temp array; both arrays utilized in shuffleRollNums anti-cluster logic
            this.redRollNums.push(6, 6, 8, 8);
        }

        this.shuffle(this.rollNums);
        this.shuffle(this.redRollNums);
    }   

    shuffle(arr) {
        Phaser.Utils.Array.Shuffle(arr);       
    }

    //MAYBE: Add backtracking search logic for red tile anti-clustering which would work more efficiently on larger maps
    assignRedNums() {
        this.notDesertHexList = [];
        this.notDesertOrRedHexList = [];
        let neighborIsRed = false;

        //Create an array of hexes that aren't desert hexes
        for (let i = 0; i < this.hexTileArr.length; i++) {
            if (this.hexTileArr[i].getTerrain() != "Desert") {
                this.notDesertHexList.push(this.hexTileArr[i]);
            }
        }

        this.shuffle(this.notDesertHexList);
          
        //Go through the list of non-desert hexes, check if ANY of their neighbors are a red hex
            //If neighbors aren't a red hex, assign it a red roll number and break outer loop once there are no more red numbers
        for (let i = 0; i < this.notDesertHexList.length; i++) {   
            let hexNeighbors = this.getHexNeighbors(this.notDesertHexList[i]);         
            
            for (let a = 0; a < hexNeighbors.length; a++) {
                if (hexNeighbors[a].getIsRed() == true) {
                    neighborIsRed = true;
                }               
            }

            if (neighborIsRed == false) {
                this.notDesertHexList[i].setRollNum(this.redRollNums.pop());
            }

            neighborIsRed = false;

            if (this.redRollNums.length == 0) {
                break;
            }
        }

        //Create an array of hexes that aren't desert hexes or red number hexes
        for (let i = 0; i < this.notDesertHexList.length; i++) {
            if (this.notDesertHexList[i].getIsRed() == false) {
                this.notDesertOrRedHexList.push(this.notDesertHexList[i]);
            }
        }

        //Give these "normal" hexes a roll number from the main array of rollNums
        for (let i = 0; i < this.notDesertOrRedHexList.length; i++) {
            this.notDesertOrRedHexList[i].setRollNum(this.rollNums.pop());
        }

    }

    buildHexBoard() {
        this.buildHexTiles();
        this.buildVertices();
        this.buildEdges();
    }


    buildHexTiles() {       
        let desertHexCt = 0;
        
        for (let q = this.hexRadius * -1; q <= this.hexRadius; q++) {
            //rMin is assigned to the larger value between negative hexRadius and negative q minus hexRadius
            let rMin = this.hexRadius * - 1 > q * -1 - this.hexRadius ? this.hexRadius * - 1 : q * - 1 - this.hexRadius;
            //rMax is assigned to the smaller value between hexRadius and negative q plus hexRadius
            let rMax = this.hexRadius < q * -1 + this.hexRadius ? this.hexRadius : q * -1 + this.hexRadius;

            for (let r = rMin; r <= rMax; r++) {
                let terrain = this.chooseTerrain();
                let toHaveRobber = false;

                //assign roll number 0 (Desert hexes can't be rolled) to all deserts, else generate a real roll number.
                    //Check for first-generated desert hex and assign it a robber, else no robber.
                if (terrain == "Desert") {
                    desertHexCt++;
                    if (desertHexCt == 1) {
                        toHaveRobber = true;
                    }
                    else {
                        toHaveRobber = false;
                    }
                }

                let hexTile = new HexTile([q, r], terrain, toHaveRobber, this.size);                
                this.hexTileArr.push(hexTile);
            }
        }

        this.assignRedNums();
    }

    buildVertices() {

    }

    buildEdges() {
        for (let i = 0; i < this.hexTileArr.length; i++) {
            let hexNeighbors = this.getHexNeighborsByEdge(this.hexTileArr[i]); //Get the list of 6 hextile neighbors per edge
            
            for (let a = 0; a < 6; a++) {
                if (hexNeighbors[a] == null) { //No hextile neighbor means hextile is a boundary
                    let edge = new Edge([this.hexTileArr[i]]); //Create an edge with just one connected hextile
                    this.edgeArray.push(edge);
                    this.hexTileArr[i].addSharedEdge(edge);
                }
                else {
                    let edgeElement = this.edgeArray.find(arr => arr.getSharedHexes().includes(hexNeighbors[a]) && arr.getSharedHexes().includes(this.hexTileArr[i]));
                    
                    if (edgeElement != undefined) {
                        this.hexTileArr[i].addSharedEdge(edgeElement);
                    }
                    else {
                        let edge = new Edge([hexNeighbors[a], this.hexTileArr[i]]);
                        this.edgeArray.push(edge);
                        this.hexTileArr[i].addSharedEdge(edge);
                    }
                }
            }
        }
    }

    chooseTerrain() {
        return this.terrains.pop();
    }

    chooseRollNum() {
        return this.rollNums.pop();
    }

    getHexNeighbors(hex) {
        let anchorCoords = hex.getAxialCoords();
        let tempList = [];
        let neighborHexList = [];
        
        //find neighbor axial coords by offsetting values -- split into 6 push statements for (hopefully) easier readability
        //Calculations: (+1, 0), (+1, -1), (0, -1), (-1, 0), (-1, +1), (0, +1)
        tempList.push([anchorCoords[0] + 1, anchorCoords[1]]);
        tempList.push([anchorCoords[0] + 1, anchorCoords[1] - 1]);
        tempList.push([anchorCoords[0], anchorCoords[1] - 1]);
        tempList.push([anchorCoords[0] - 1, anchorCoords[1]]);
        tempList.push([anchorCoords[0] - 1, anchorCoords[1] + 1]);
        tempList.push([anchorCoords[0], anchorCoords[1] + 1]);

        //Check if each pair of coods in tempList are real coords on the board by comparing them with existing hexes
        //if true, add to final neighboring hex array and return
        for (let i = 0; i < this.hexTileArr.length; i++) {
            for (let a = 0; a < tempList.length; a++) {
                if (this.hexTileArr[i].getAxialCoords().every((value, index) => value === tempList[a][index])) {
                    neighborHexList.push(this.hexTileArr[i]);
                }
            }
        }

        return neighborHexList;
    }

    getHexNeighborsByEdge(hex) {
        let hexNeighbors = this.getHexNeighbors(hex);
        let axCoords = hex.getAxialCoords();
        let neighborEdgeList = Array(6).fill(null); 
        let offsetPairs = [[1,0], [1,-1], [0,-1], [-1,0], [-1,1], [0,1]];

        for (let i = 0; i < hexNeighbors.length; i++) {
            let neighborAxCoords = hexNeighbors[i].getAxialCoords();
            let axDelta = [neighborAxCoords[0] - axCoords[0], neighborAxCoords[1] - axCoords[1]];

            let index = offsetPairs.findIndex(arr => arr.every((num, idx) => num === axDelta[idx]));
            neighborEdgeList[index] = hexNeighbors[i];
        }

        return neighborEdgeList;
    }

    getHexTileArr() {
        return this.hexTileArr;
    }
}
