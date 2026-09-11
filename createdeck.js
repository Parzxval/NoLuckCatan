class DeckofCards {
    constructor(min7, max7) {
        this.min7 = min7;
        this.max7 = max7;
        this.num7Cards = 6; //Default number of 7 cards
    }        
    /**
     * Randomly choose a number of 7 cards every reshuffle (Robber & Discard) from a user-defined range.
     */
    chooseNum7Cards() {
        this.num7Cards = Math.floor(Math.random() * (this.max7 - this.min7 +1) + this.min7);
    }    
    /**
     * Create a deck (array) of 2-dice roll combinations and push x amount of 7 cards defined by chooseNum7Cards.
     * Rerolls chooseNum7Cards()
     * 
     * @returns {Array} Deck of cards mimicking equally-distributed 2-dice rolls
     */
    createDeck() {
        //All roll combinations with equal distributions using 2 dice
        const cardDeck = [2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 8, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 11, 11, 12];
        this.chooseNum7Cards();

        for (let i = 0; i < this.num7Cards; i++) {
            cardDeck.push(7);
        }

        return cardDeck;
    }
}



