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
        this.player["webcash"] = value;
    }
    @Input() set level(value) {
        this.player["level"] = value;
    }

    player = {
        'user': '',
        'cash': 0,
        'webcash': 0,
        'level': 0
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