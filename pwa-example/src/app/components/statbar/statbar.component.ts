import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-statbar',
    templateUrl: './statbar.component.html',
    styleUrls: ['./statbar.component.scss'],
})
export class StatbarComponent implements OnInit {
    @Input() set user(value) {
        this.player["user"] = value;
    }
    @Input() set cash(value) {
        this.player["cash"] = value;
    }
    @Input() set webcash(value) {
        this.player["web_cash"] = value;
    }
    @Input() set exp(value) {
        this.player["exp"] = value;
    }

    player = {
        'user': '',
        'cash': 0,
        'web_cash': 0,
        'exp': 0
    };

    constructor() { }

    ngOnInit() {
        this.updatePlayer();
        console.log('statbar: ngOnInit');
    }

    updatePlayer() {
        let saveData = JSON.parse(localStorage.getItem('saveData'));
        this.player = saveData.currentUser;
    }
}