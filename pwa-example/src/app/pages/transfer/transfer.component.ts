import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from 'src/app/providers/api.service';
import { Record } from 'src/app/util/record';

@Component({ templateUrl: 'transfer.component.html' })
export class TransferComponent implements OnInit {
    baseUrl = 'https://jlf40.brighton.domains/dump/angular/test/api';
    users: Record[];
    selectedRecord: Record = { id: null, user: null, pass: null, cash: null };

    constructor(private _location: Location, private apiService: ApiService) { }


    ngOnInit() {
        this.getRecords();
    }

    getRecords() {
        this.apiService.readRecords().subscribe((users: Record[]) => {
            this.users = users;
            console.log(this.users);
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