import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { AlertController } from '@ionic/angular';
import { ApiService } from 'src/app/providers/api.service';

@Component({
    templateUrl: 'account.component.html',
    styleUrls: ['./account.component.scss'],
})
export class AccountComponent implements OnInit {
    showLoading;
    saveData;
    player;

    levelThresholds = [1000, 2500, 5000, 7500, 10000, 15000, 25000, 35000, 50000, 100000, 125000, 150000, 175000, 200000, 250000, 400000, 600000, 850000, 1000000];

    constructor(private _apiService: ApiService, private _location: Location, private alertCtrl: AlertController) {
        this.showLoading = false;
    }

    ngOnInit() {
        this.saveData = JSON.parse(localStorage.getItem('saveData'));
        this.player = this.saveData.currentUser;
        let time = Date.now();
        console.log(time.toLocaleString())
    }

    onLogoutClick() {
        console.log('onTransferItemClick');
        let header = 'Logout';
        let message = 'Are you sure you want to sign out?';
        let buttons = [
            {
                text: 'Cancel',
                role: 'cancel'
            }, {
                text: 'Confirm',
                handler: () => {
                    console.log('Confirm Okay');
                    this.logout();
                }
            }
        ];

        this.presentAlertConfirm(header, message, buttons);
    }

    onDeleteClick() {
        console.log('onTransferItemClick');
        let header = 'Delete Account';
        let message = 'Are you sure you want to delete your account?<br><br><strong>Note:</strong> This will also invalidate your account for use in <strong>Lil\' Thug Outlaw</strong>.';
        let buttons = [
            {
                text: 'Cancel',
                role: 'cancel'
            }, {
                text: 'Confirm',
                handler: () => {
                    console.log('Confirm Okay');
                    this.delete();
                }
            }
        ];

        this.presentAlertConfirm(header, message, buttons);
    }

    goBack() {
        this._location.back();
    }

    async presentAlertConfirm(header, message, buttons) {
        const alert = await this.alertCtrl.create({
            header: header,
            message: message,
            cssClass: 'alert-confirm',
            buttons: buttons
        });

        await alert.present();
    }

    delete() {
        this._apiService.deleteRecord(this.saveData.currentUser.id).subscribe(() => {
            // remove from device accounts
            let accountIdx = this.saveData.accounts.findIndex(account => account.id === this.saveData.currentUser.id);
            this.saveData.accounts.splice(accountIdx, 1);

            // clear currentUser
            this.saveData.currentUser = null;
            localStorage.setItem('saveData', JSON.stringify(this.saveData));

            // show loading and return to home
            requestAnimationFrame(() => {
                this.showLoading = true;
                setTimeout(() => {
                    this.goBack();
                }, 800);
            });
        });
    }

    logout() {
        // clear currentUser
        this.saveData.currentUser = null;
        localStorage.setItem('saveData', JSON.stringify(this.saveData));

        // show loading and return to home
        requestAnimationFrame(() => {
            this.showLoading = true;
            setTimeout(() => {
                this.goBack();
            }, 800);
        });
    }
}