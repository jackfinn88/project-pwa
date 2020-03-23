import { Component, Input, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { GameScene } from 'src/app/components/game/game-scene';
import { WelcomeScene } from 'src/app/components/game/welcome-scene';
import { ScoreScene } from 'src/app/components/game/score-scene';
import { StarfallGame } from '../game/game.component';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';

@Component({
    templateUrl: 'game-modal.component.html',
    styleUrls: ['./game-modal.component.scss']
})
export class GameModalComponent implements OnInit, OnDestroy {
    @HostListener('window:message', ['$event'])
    onMessage(event) {
        if (event.origin !== "https://jlf40.brighton.domains") {
            return false;
        } else {
            console.log('Message:', event.data);
        }
    }
    @Input() job: any;
    gameType;
    fullScreenKey;
    config = {
        title: "Starfall",
        scale: {
            mode: Phaser.Scale.FIT,
            parent: 'game',
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 800,
            height: 600
        },
        scene: [WelcomeScene, GameScene, ScoreScene],
        physics: {
            default: "arcade",
            arcade: {
                debug: false
            }
        },
        backgroundColor: "#000033"
    };
    game: StarfallGame;
    constructor(private screenOrientation: ScreenOrientation, private platform: Platform, private modalCtrl: ModalController) { }

    ngOnInit() {
        // add fake history to prevent navigation from hardware back button
        if (!window.history.state.modal) {
            const modalState = { modal: true };
            history.pushState(modalState, null);
        }

        // get game type
        this.gameType = this.job.game < 2 ? 'starfall' : 'knightfall';

        this.fullScreenKey = this.getRequestFullScreenKey();
    }

    ngAfterViewInit() {
        if (this.job.game < 2) {
            this.game = new StarfallGame(this.config);

            // tbd: force landscape
            this.platform.ready().then(() => {
                console.log('platform ready');
                document.querySelector('canvas').style.width = '608px';
                window.addEventListener("resize", this.resize, false);
                this.enterFullScreen();
            });
        }
    }

    enterFullScreen() {
        // request fullscreen mode to lock screen
        document.documentElement[this.fullScreenKey.request]();
        this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.LANDSCAPE);
    }

    resize() {
        console.log('resize');
        let canvas = document.querySelector("canvas");
        let windowWidth = window.innerWidth;
        let windowHeight = window.innerHeight;
        let windowRatio = windowWidth / windowHeight;
        let gameRatio = (this.game.config.width as number) / (this.game.config.height as number);

        if (windowRatio < gameRatio) {
            canvas.style.width = windowWidth + "px";
            canvas.style.height = (windowWidth / gameRatio) + "px";
        }
        else {
            canvas.style.width = (windowHeight * gameRatio) + "px";
            canvas.style.height = windowHeight + "px";
        }
    }

    async closeModal() {
        // closing by button doesn't trigger autoclose overlay service
        // manually navigate from fake history
        history.back();
        await this.modalCtrl.dismiss();
    }

    private getRequestFullScreenKey() {
        let go = 'requestFullscreen';
        let leave = 'exitFullscreen';
        if ('mozRequestFullScreen' in document.documentElement) {
            go = 'mozRequestFullScreen';
            leave = 'mozCancelFullScreen';
        } else if ('webkitRequestFullscreen' in document.documentElement) {
            go = 'webkitRequestFullscreen';
            leave = 'webkitExitFullscreen';
        } else if ('msRequestFullscreen' in document.documentElement) {
            go = 'msRequestFullscreen';
            leave = 'msExitFullscreen';
        }
        return { request: go, exit: leave };
    }

    ngOnDestroy() {
        if (this.job.game < 2) {
            this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
            this.screenOrientation.unlock();
            let exitFullScreen = 'document.' + this.fullScreenKey.exit + '()';
            eval(exitFullScreen);
        }
    }
}