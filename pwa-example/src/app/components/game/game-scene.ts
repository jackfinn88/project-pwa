import "phaser";
export class GameScene extends Phaser.Scene {
    delta: number;
    lastPacketTime: number;
    packetsCaught: number;
    packetsFallen: number;
    packetVelocity: number;
    packetsPerHit: number;
    ground: Phaser.Physics.Arcade.StaticGroup;

    packetsNeeded: number;
    maxPacketsFallen: number;
    firstUpdate = true;
    gameOver = false;
    packets = [];

    constructor() {
        super({
            key: "GameScene"
        });
    }

    init(): void {
        let options = (this.game as any).options;
        this.delta = 1000;
        this.lastPacketTime = 0;
        this.packetsCaught = 0;
        this.packetsFallen = 0;
        this.packetsNeeded = options.catch;
        this.maxPacketsFallen = options.lose;
        this.packetVelocity = options.packetVelocity;
        this.packetsPerHit = options.packetsPerHit
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

        var diff: number = time - this.lastPacketTime;
        if (diff > this.delta) {
            this.lastPacketTime = time;
            if (this.delta > 500) {
                this.delta -= 20;
            }
            this.emitPacket();
        }
    }

    private onClick(packet: Phaser.Physics.Arcade.Image) {
        if (this.gameOver) return;

        packet.setTint(0x00ff00);
        packet.setVelocity(0, 0);
        if (this.packetsCaught + this.packetsPerHit > this.packetsNeeded) this.packetsCaught = this.packetsNeeded
        else this.packetsCaught += this.packetsPerHit;

        this.game.events.emit('game-event', {
            end: this.gameOver,
            stats: {
                'win': false,
                'caught': this.packetsCaught,
                'lost': this.packetsFallen
            }
        });

        this.time.delayedCall(100, (packet) => {
            packet.destroy();
            if (this.packetsCaught >= this.packetsNeeded) {
                if (!this.gameOver) {
                    this.gameWin();
                }
            }
        }, [packet], this);

    }

    private onFall(packet: Phaser.Physics.Arcade.Image) {
        if (this.gameOver) return;

        packet.setTint(0xff0000);
        this.packetsFallen += 1;

        this.game.events.emit('game-event', {
            end: this.gameOver,
            stats: {
                'win': false,
                'caught': this.packetsCaught,
                'lost': this.packetsFallen
            }
        });

        this.time.delayedCall(100, (packet) => {
            packet.destroy();
            if (this.packetsFallen >= this.maxPacketsFallen) {
                if (!this.gameOver) {
                    this.gameLose();
                }
            }
        }, [packet], this);

    }

    private emitPacket(): void {
        if (this.gameOver) return;

        var packet: Phaser.Physics.Arcade.Image;
        var x = Phaser.Math.Between(25, 775);
        var y = 26;
        packet = this.physics.add.image(x, y, "file");
        packet.setDisplaySize(70, 70);
        packet.setVelocity(0, this.packetVelocity);
        packet.setInteractive();
        packet.on('pointerdown', () => { this.onClick(packet) });
        this.physics.add.collider(packet, this.ground,
            () => { this.onFall(packet) }, null, this);
    }

    // clear timers and emit game win event
    private gameWin() {
        this.time.systems.shutdown();
        if (!this.gameOver) {
            this.gameOver = true;
            this.game.events.emit('game-event', {
                end: this.gameOver,
                stats: {
                    'win': true,
                    'caught': this.packetsCaught,
                    'lost': this.packetsFallen
                }
            });
        }
    }

    // clear timers and emit game lose event
    private gameLose() {
        this.time.systems.shutdown();
        if (!this.gameOver) {
            this.gameOver = true;
            this.game.events.emit('game-event', {
                end: this.gameOver,
                stats: {
                    'win': false,
                    'caught': this.packetsCaught,
                    'lost': this.packetsFallen
                }
            });
        }
    }
};