import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { StarfallGame } from 'src/app/components/game/game.component';
import { GameScene } from 'src/app/components/game/game-scene';
import { WelcomeScene } from 'src/app/components/game/welcome-scene';
import { ScoreScene } from 'src/app/components/game/score-scene';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { Platform } from '@ionic/angular';

@Component({
    templateUrl: 'view-game.component.html',
    styleUrls: ['./view-game.component.scss']
})
export class GameComponent {
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
    constructor(private location: Location, private screenOrientation: ScreenOrientation, private platform: Platform) { }

    goBack() {
        this.location.back();
    }

    ngAfterViewInit() {
        this.game = new StarfallGame(this.config);

        // tbd: force landscape
        this.platform.ready().then(() => {
            // request fullscreen mode to lock screen
            document.documentElement[this.getRequestFullScreenKey()]();
            this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.LANDSCAPE);
        })
    }

    private getRequestFullScreenKey() {
        let goFullScreen = 'requestFullscreen';
        if ('mozRequestFullScreen' in document.documentElement) {
            goFullScreen = 'mozRequestFullScreen';
        } else if ('webkitRequestFullscreen' in document.documentElement) {
            goFullScreen = 'webkitRequestFullscreen';
        } else if ('msRequestFullscreen' in document.documentElement) {
            goFullScreen = 'msRequestFullscreen';
        }
        return goFullScreen;
    }
}