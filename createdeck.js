/**
 * A chip bag randomizer ~ represents a standard distribution of all possible 2-dice rolls as a deck of cards.
 * Allows for the same values to be exhausted for all players, favoring fairness over traditional dice luck.
 * 
 * takeTurn() groups core functionalities of DeckofCards -- only call needed in standard gamemode.
 * 
 * @class
 */
class DeckofCards {
    /**
     * Create an empty card deck.
     * @param {number} min7 - User-defined minimum value of possible 7 cards (Robber/discard).
     * @param {number} max7 - User-defined maximum value of possible 7 cards (Robber/discard).
     */
    constructor(min7, max7) {
        this.min7 = min7;
        this.max7 = max7;
        this.num7Cards = null;
        this.cardDeck = [];
    }

    /**
     * An all-in-one function call for the purpose of standard gamemode
     * Calls createDeck() and shuffleDeck() if cardDeck.length == 0, then draws card
     * 
     * @return {number} Card value drawn from helper function drawCard()
     */
    takeTurn() {        
        if (this.getDeckLength() == 0) {
            this.createDeck();
            this.shuffleDeck();
        }
         
        return this.drawCard();
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
     */
    createDeck() {
        //All roll combinations with equal distributions using 2 dice
        this.cardDeck = [2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 8, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 11, 11, 12];
        this.chooseNum7Cards();

        for (let i = 0; i < this.num7Cards; i++) {
            this.cardDeck.push(7);
        }
    }

    /**
     * Shuffles dec using Phaser 4's Phaser.Utils.Array.Shuffle() function.
     */
    shuffleDeck() {
        Phaser.Utils.Array.Shuffle(this.cardDeck);
    }

    /**
     * @return {Array} returns reference to cardDeck, not a copy.
     */
    getDeck() {
        return this.cardDeck;
    }

    getDeckLength() {
        return this.cardDeck.length;
    }

    /**
     * Pops value off cardDeck; helper function to takeTurn.
     * 
     * @return {number} Card value drawn.
     */
    drawCard() {
        return this.cardDeck.pop();
    }
}



