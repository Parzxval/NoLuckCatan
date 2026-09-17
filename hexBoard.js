class HexTile {
    constructor(pixelPos, axialCoords, terrain, hasRobber = false) {
        this.pixelPos = pixelPos;
        this.axialCoords = axialCoords;
        this.terrain = terrain;
        this.hasRobber = hasRobber;
        this.sharedVertices = [];
        this.sharedEdges = [];
        this.rollNum = terrain == "Desert" ? 0 : null; 
        this.isRed = false; //6 and 8 valued tiles are marked as red, so they can't be placed next to each other (too OP)
    }

    addSharedVertex(vertex) {
        this.sharedVertices.push(vertex);
    }

    addSharedEdge() {

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
    constructor() {
        this.hasRoad = false;
    }

    addRoad() {
        this.hasRoad = true;
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
    constructor(hexRadius = 2) {
            this.hexRadius = hexRadius < 2 ? 2 : hexRadius; //hexRadius cannot be under 2, otherwise assigns to 2.
            this.hexTileArr = [];
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
            let hexNeighbors = this.getNeighbors(this.notDesertHexList[i]);         
            
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

                let hexTile = new HexTile(this.getHexToPixel(), [q, r], terrain, toHaveRobber);                
                this.hexTileArr.push(hexTile);
            }
        }
    } 

    getHexToPixel() {
        //TODO: add logic
        return [x, y];
    }

    chooseTerrain() {
        return this.terrains.pop();
    }

    chooseRollNum() {
        return this.rollNums.pop();
    }

    getNeighbors(hex) {
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
}
