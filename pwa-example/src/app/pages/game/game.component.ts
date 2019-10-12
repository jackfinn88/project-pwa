import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({ templateUrl: 'game.component.html' })
export class GameComponent {
    constructor(private location: Location) { }

    goBack() {
        this.location.back();
    }
}