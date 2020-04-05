import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Location } from '@angular/common';
import { ApiService } from 'src/app/providers/api.service';
import { Record } from 'src/app/util/record';
import { AlertController } from '@ionic/angular';

@Component({
    templateUrl: 'account.component.html',
    styleUrls: ['./account.component.scss'],
})
export class AccountComponent implements OnInit {
    showLoading;
    saveData;
    player;

    constructor(private _location: Location, private alertCtrl: AlertController) {
        this.showLoading = false;
    }

    ngOnInit() {
        this.saveData = JSON.parse(localStorage.getItem('saveData'));
        this.player = this.saveData.currentUser;
    }

    onLogoutClick() {
        console.log('onTransferItemClick');
        this.presentAlertConfirm();
    }

    goBack() {
        this._location.back();
    }

    async presentAlertConfirm() {
        const alert = await this.alertCtrl.create({
            header: 'Logout',
            message: 'Are you sure you want to logout?',
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
                        this.logout();
                    }
                }
            ]
        });

        await alert.present();
    }

    logout() {
        /*let data = JSON.parse(localStorage.getItem('saveData'));
        data.currentUser = null;
        localStorage.setItem('saveData', JSON.stringify(data));*/

        this.saveData.currentUser = null;
        localStorage.setItem('saveData', JSON.stringify(this.saveData));

        requestAnimationFrame(() => {
            this.showLoading = true;
            setTimeout(() => {
                this.goBack();
            }, 800);
        });
    }
}