import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Location } from '@angular/common';
import { ApiService } from 'src/app/providers/api.service';
import { AlertController } from '@ionic/angular';

@Component({
    templateUrl: 'transfer.component.html',
    styleUrls: ['./transfer.component.scss'],
})
export class TransferComponent implements OnInit {
    baseUrl = 'https://jlf40.brighton.domains/ci301/app/api';
    users;

    saveData;
    account;
    availableAmounts;
    amountIncrements = [500, 1000, 2000, 5000, 10000, 20000];

    constructor(private _location: Location, private _apiService: ApiService, private alertCtrl: AlertController, private _cdr: ChangeDetectorRef) { }


    ngOnInit() {
        this.saveData = JSON.parse(localStorage.getItem('saveData'));
        this.account = JSON.parse(localStorage.getItem('account'));
        this.saveData.currentUser.cash = parseInt(this.saveData.currentUser.cash, 10);

        this.updateAmounts();
    }

    updateAmounts() {
        this.availableAmounts = [];

        if (!this.saveData.currentUser.cash) return;

        this.amountIncrements.forEach((increment) => {
            if (this.saveData.currentUser.cash > increment) {
                this.availableAmounts.push(increment);
            }
        });

        if (!this.availableAmounts.length || this.saveData.currentUser.cash > this.availableAmounts[this.availableAmounts.length - 1]) this.availableAmounts.push(this.saveData.currentUser.cash);

        this._cdr.detectChanges();
    }

    onTransferItemClick(event) {
        // transfer amount from cash to LTOcash
        let amount = parseInt(event.target.textContent, 10);
        this.presentAlertConfirm(amount);

    }

    confirmTransfer(amount) {
        let userCash = parseInt(this.saveData.currentUser.cash, 10);
        let userWebCash = parseInt(this.saveData.currentUser.webcash, 10);

        this.saveData.currentUser.cash = userCash - amount;
        this.saveData.currentUser.webcash = userWebCash + amount;

        this.updateRecord();
    }

    updateRecord() {
        let record = {
            id: this.saveData.currentUser["id"],
            user: this.saveData.currentUser["user"],
            pass: this.saveData.currentUser["pass"],
            ph_cash: this.saveData.currentUser["cash"],
            ph_exp: parseInt(this.saveData.currentUser["exp"], 10),
            ph_total_exp: parseInt(this.saveData.currentUser["total-exp"], 10),
            ph_level: parseInt(this.saveData.currentUser["level"], 10),
            ph_completed: parseInt(this.saveData.currentUser["jobs-completed"], 10),
            ph_failed: parseInt(this.saveData.currentUser["jobs-failed"], 10),
            lto_equipped: this.account["lto_equipped"],
            lto_cash: this.saveData.currentUser["webcash"],
            lto_exp: this.account["lto_exp"],
            lto_total_exp: this.account["lto_total_exp"],
            lto_player_level: this.account["lto_player_level"],
            lto_player_next_level: this.account["lto_player_next_level"],
            lto_game_level: this.account["lto_game_level"],
            lto_sfx: this.account["lto_sfx"],
            lto_music: this.account["lto_music"],
            lto_difficulty: this.account["lto_difficulty"]
        }

        this._apiService.updateRecord(record).subscribe((record) => {
            // update device accounts
            let accountIdx = this.saveData.accounts.findIndex(account => account.id === this.saveData.currentUser.id);
            this.saveData.accounts.splice(accountIdx, 1, this.saveData.currentUser);

            localStorage.setItem('saveData', JSON.stringify(this.saveData));

            this.updateAmounts();
        });
    }

    goBack() {
        this._location.back();
    }

    async presentAlertConfirm(amount) {
        const alert = await this.alertCtrl.create({
            header: 'Transfer',
            message: 'Are you sure you want to transfer £<strong>' + amount + '</strong>?',
            cssClass: 'alert-confirm',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel'
                }, {
                    text: 'Confirm',
                    handler: () => {
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