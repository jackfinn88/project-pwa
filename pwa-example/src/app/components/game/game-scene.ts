import "phaser";
export class GameScene extends Phaser.Scene {
    delta: number;
    lastFileTime: number;
    filesCaught: number;
    filesFallen: number;
    ground: Phaser.Physics.Arcade.StaticGroup;

    filesNeeded: number;
    maxFilesFallen: number;
    firstUpdate = true;
    gameOver = false;
    files = [];

    constructor() {
        super({
            key: "GameScene"
        });
    }

    init(): void {
        let options = (this.game as any).options;
        this.delta = 1000;
        this.lastFileTime = 0;
        this.filesCaught = 0;
        this.filesFallen = 0;
        this.filesNeeded = options.catch;
        this.maxFilesFallen = options.lose;
    }

    preload(): void {
        this.load.image("file", "assets/game/file_icon.png");
        this.load.image("ground", "assets/game/ground.png");
    }

    create(): void {
        this.ground = this.physics.add.staticGroup({
            key: 'ground',
            frameQuantity: 20
        });
        Phaser.Actions.PlaceOnLine(this.ground.getChildren(),
            new Phaser.Geom.Line(20, 580, 820, 580));
        this.ground.refresh();
    }

    update(time: number): void {
        if (this.firstUpdate) this.game.events.emit('first-update'); this.firstUpdate = false;

        if (this.gameOver) return;

        var diff: number = time - this.lastFileTime;
        if (diff > this.delta) {
            this.lastFileTime = time;
            if (this.delta > 500) {
                this.delta -= 20;
            }
            this.emitFile();
        }
    }

    private onClick(file: Phaser.Physics.Arcade.Image) {
        file.setTint(0x00ff00);
        file.setVelocity(0, 0);
        this.filesCaught += 1;

        this.game.events.emit('game-event', {
            end: this.gameOver,
            stats: {
                'win': false,
                'caught': this.filesCaught,
                'lost': this.filesFallen
            }
        });

        this.time.delayedCall(100, (file) => {
            if (!this.gameOver) {
                file.destroy();
                if (this.filesCaught >= this.filesNeeded) {
                    this.gameWin();
                }
            }
        }, [file], this);

    }

    private onFall(file: Phaser.Physics.Arcade.Image) {
        file.setTint(0xff0000);
        this.filesFallen += 1;

        this.game.events.emit('game-event', {
            end: this.gameOver,
            stats: {
                'win': false,
                'caught': this.filesCaught,
                'lost': this.filesFallen
            }
        });

        this.time.delayedCall(100, (file) => {
            if (!this.gameOver) {
                file.destroy();
                if (this.filesFallen >= this.maxFilesFallen) {
                    this.gameLose();
                }
            }
        }, [file], this);

    }

    private emitFile(): void {
        var file: Phaser.Physics.Arcade.Image;
        var x = Phaser.Math.Between(25, 775);
        var y = 26;
        file = this.physics.add.image(x, y, "file");
        file.setDisplaySize(50, 50);
        file.setVelocity(0, 200);
        file.setInteractive();
        file.on('pointerdown', () => { this.onClick(file) });
        this.physics.add.collider(file, this.ground,
            () => { this.onFall(file) }, null, this);
    }

    private gameLose() {
        console.log('gameLose');
        this.time.systems.shutdown();
        if (!this.gameOver) {
            this.gameOver = true;
            this.game.events.emit('game-event', {
                end: this.gameOver,
                stats: {
                    'win': false,
                    'caught': this.filesCaught,
                    'lost': this.filesFallen
                }
            });
        }
    }

    private gameWin() {
        console.log('gameWin');
        this.time.systems.shutdown();
        if (!this.gameOver) {
            this.gameOver = true;
            this.game.events.emit('game-event', {
                end: this.gameOver,
                stats: {
                    'win': true,
                    'caught': this.filesCaught,
                    'lost': this.filesFallen
                }
            });
        }
    }
};