import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ApiService } from 'src/app/providers/api.service';
import { Record } from 'src/app/util/record';

@Component({
    templateUrl: 'db.component.html',
    styleUrls: ['./db.component.scss'],
})
export class DBComponent implements OnInit {
    baseUrl = 'https://jlf40.brighton.domains/dump/angular/test/api';
    users: Record[];
    selectedRecord: Record = { id: null, user: null, pass: null, cash: null, web_cash: null, exp: null, level: null, completed: null, failed: null };

    saveData;
    currentUser;

    constructor(private _location: Location, private apiService: ApiService) { }


    ngOnInit() {
        this.getRecords();

        this.saveData = JSON.parse(localStorage.getItem('saveData'));
        this.currentUser = this.saveData.currentUser;
    }

    clearStorage() {
        localStorage.removeItem('saveData');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        // this.clearStorage();
    }

    getRecords() {
        console.log('getRecords');
        this.apiService.readRecords(null).subscribe((users: Record[]) => {
            this.users = users;
            console.log(this.users);

            // find current user from database
            let dbIdx = this.users.findIndex(user => user.id === this.currentUser.id);
            if (dbIdx > -1) {
                // sync wth db
                this.currentUser['id'] = this.users[dbIdx].id;
                this.currentUser['user'] = this.users[dbIdx].user;
                this.currentUser['pass'] = this.users[dbIdx].pass;
                this.currentUser['cash'] = this.users[dbIdx].cash;
                this.currentUser['web_cash'] = this.users[dbIdx].web_cash;
                this.currentUser['exp'] = this.users[dbIdx].exp;
                this.currentUser['level'] = this.users[dbIdx].level;
                this.currentUser['job-completed'] = this.users[dbIdx].completed;
                this.currentUser['job-failed'] = this.users[dbIdx].failed;
            }

            // update device accounts
            let accountIdx = this.saveData.accounts.findIndex(account => account.id === this.currentUser.id);
            this.saveData.currentUser = this.currentUser;
            this.saveData.accounts.splice(accountIdx, 1, this.currentUser);

            localStorage.setItem('saveData', JSON.stringify(this.saveData));
        });
    }

    selectRecord(record: Record) {
        this.selectedRecord = record;
    }

    createOrUpdateRecord(form) {
        if (this.selectedRecord && this.selectedRecord.id) {
            form.value.id = this.selectedRecord.id;
            this.apiService.updateRecord(form.value).subscribe((record: Record) => {
                console.log("Record updated, ", record);
                this.getRecords();
            });
        }
        else {

            this.apiService.createRecord(form.value).subscribe((record: Record) => {
                console.log("Record created, ", record);
                this.getRecords();

                if (record) {
                    // tbd: log user in - localstorage
                    // localStorage.setItem('logged', JSON.stringify({ logged: true }));
                }
            });
        }

    }

    deleteRecord(id) {
        this.apiService.deleteRecord(id).subscribe((record: Record) => {
            console.log("Record deleted, ", record);
            this.getRecords();
        });
    }

    goBack() {
        this._location.back();
    }
}