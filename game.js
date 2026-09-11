class Menu extends Phaser.Scene {

}

class GameScene extends Phaser.Scene {
    constructor() {
        super('outro');
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
        width: 1730,
        height: 1080
    },
    scene: [Menu, GameScene],
    title: "NoLuckCatan",
});