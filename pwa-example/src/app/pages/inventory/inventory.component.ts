import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Location } from '@angular/common';
import { ApiService } from 'src/app/providers/api.service';
import { Record } from 'src/app/util/record';
import { AlertController } from '@ionic/angular';

@Component({
    templateUrl: 'inventory.component.html',
    styleUrls: ['./inventory.component.scss'],
})
export class InventoryComponent implements OnInit {
    baseUrl = 'https://jlf40.brighton.domains/dump/angular/test/api';
    users: Record[];

    saveData;
    availableAmounts;
    amountIncrements = [100, 500, 1000, 5000];

    constructor(private _location: Location, private _apiService: ApiService, private alertCtrl: AlertController, private _cdr: ChangeDetectorRef) { }


    ngOnInit() {
        this.saveData = JSON.parse(localStorage.getItem('saveData'));
    }

    onTransferItemClick(event) {
        console.log('onTransferItemClick', event);
        // transfer amount from cash to web_cash
        let amount = parseInt(event.target.textContent, 10);
        this.presentAlertConfirm(amount);

    }

    confirmTransfer(amount) {
        let userCash = parseInt(this.saveData.currentUser.cash, 10);
        let userWebCash = parseInt(this.saveData.currentUser.web_cash, 10);

        this.saveData.currentUser.cash = userCash - amount;
        this.saveData.currentUser.web_cash = userWebCash + amount;

        this.updateRecord();
    }

    updateRecord() {
        let record = {
            id: this.saveData.currentUser["id"],
            user: this.saveData.currentUser["user"],
            pass: this.saveData.currentUser["pass"],
            cash: this.saveData.currentUser["cash"],
            web_cash: this.saveData.currentUser["web_cash"],
            exp: parseInt(this.saveData.currentUser["exp"], 10),
            level: parseInt(this.saveData.currentUser["level"], 10),
            completed: parseInt(this.saveData.currentUser["jobs-completed"], 10),
            failed: parseInt(this.saveData.currentUser["jobs-failed"], 10),
        }

        this._apiService.updateRecord(record).subscribe((record: Record) => {
            // update device accounts
            let accountIdx = this.saveData.accounts.findIndex(account => account.id === this.saveData.currentUser.id);
            this.saveData.accounts.splice(accountIdx, 1, this.saveData.currentUser);

            localStorage.setItem('saveData', JSON.stringify(this.saveData));
        });
    }

    goBack() {
        this._location.back();
    }

    async presentAlertConfirm(amount) {
        const alert = await this.alertCtrl.create({
            header: 'Confirm Transfer',
            message: 'Are you sure you want to transfer £<strong>' + amount + '</strong>?',
            cssClass: 'alert-confirm',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    handler: (blah) => {
                        console.log('Confirm Cancel: blah');
                    }
                }, {
                    text: 'Confirm',
                    handler: () => {
                        console.log('Confirm Okay');
                        this.confirmTransfer(amount);
                    }
                }
            ]
        });

        await alert.present();
    }

    ngOnDestroy() {
        // update storage
        localStorage.setItem('saveData', JSON.stringify(this.saveData));
    }
}