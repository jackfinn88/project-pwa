import { Component, OnInit } from '@angular/core';

@Component({
    templateUrl: 'home.component.html',
    styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
    logbut: any;
    logged: boolean = false;
    constructor() { }

    ngOnInit() {
        // tbd: check login
        let loggedIn = JSON.parse(localStorage.getItem('logged'));
        this.logbut = document.querySelector('#logbutton');

        if (loggedIn) {
            this.logged = true;
            this.logbut.textContent = 'Logout';
        } else {
            this.logged = false;
            this.logbut.textContent = 'Login';
        }

    }

    toggleLogin() {
        if (this.logged) {
            console.log('logout');
            this.logged = false;
            this.logbut.textContent = 'Login';
            localStorage.removeItem('logged');
        } else {
            console.log('login');
            this.logged = true;
            this.logbut.textContent = 'Logout';
            localStorage.setItem('logged', JSON.stringify({ logged: true }));
        }
    }
}