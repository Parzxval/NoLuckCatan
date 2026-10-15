const playerColors = {
    1: 0xff0000,
    2: 0x006000,
    3: 0xff8000,
    4: 0x000060
};

class Player {
    constructor(num) {
        this.playerNum = num;

        this.placementsLeft = { //not set as const for admin flexibility
            settlements: 5,
            cities: 4,
            roads: 15
        };

        this.resourceCt = {
            Wood : 0,
            Wheat: 0,
            Ore: 0,
            Brick: 0,
            Wool: 0
        };

        this.ownedEdges = [];
        this.ownedVertices = [];    
        this.victoryPts = 0;
    }

    addResource(resources, num = 1) {
        //Option to add/subtract multiple resources at once by passing a list or an individual resource 
        if (typeof resources === `string`) {
            this.resourceCt[resources] += num;
        }
        else {
            for (let [resource, num] of Object.entries(resources)) {
                this.addResource(resource, num);
            }
        }
    }

    addOwnedEdge(edge) {
        this.ownedEdges.push(edge);
    }

    addOwnedVertex(vertex) {
        this.ownedVertices.push(vertex);
    }

    addVictoryPt(pts = 1) {
        this.victoryPts += pts;
    }

    decrementPlacementsLeft(type) {
        this.placementsLeft[type]--;
    }

    getPlayerNum() {
        return this.playerNum;
    }

    getPlayerResources() {
        return this.resourceCt;
    }

    getPlayerOwnedEdges() {
        return this.ownedEdges;
    }

    getPlayerOwnedVertices() {
        return this.ownedVertices;
    }

    getPlayerVictoryPts() {
        return this.victoryPts;
    }

    getPlacementsLeft() {
        return this.placementsLeft;
    }


}