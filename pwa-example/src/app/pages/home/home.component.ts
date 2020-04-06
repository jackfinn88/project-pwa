import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ToastController, ModalController } from '@ionic/angular';
import { GameModalComponent } from 'src/app/components/game-modal/game-modal.component';

@Component({
    templateUrl: 'home.component.html',
    styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
    @ViewChild('toggleView', { static: false }) toggleButton: ElementRef;

    saveData;
    logged: boolean = false;
    showHome = false;
    showForms = false;
    formView = 'login';
    toggleFormText = { label: 'Don\'t have an account?', button: 'Sign up' };
    showLoading = false;

    constructor(public modalCtrl: ModalController, public toastController: ToastController) { }

    ngOnInit() {
        console.log('ngOnInit');
        this.saveData = JSON.parse(localStorage.getItem('saveData'));

        if (this.saveData) {
            if (this.saveData.currentUser) {
                // show home
                this.showForms = false;
                this.showHome = true;
            } else {
                // show login
                this.showHome = false;
                this.showForms = true;
            }
        } else {
            // no save data on device
            let newData = {
                currentUser: null,
                accounts: [],
            }
            this.saveData = newData;

            localStorage.setItem('saveData', JSON.stringify(newData));

            this.showHome = false;
            this.showForms = true;
        }

    }

    async presentToast(message, duration, colour) {
        const toast = await this.toastController.create({
            message: message,
            duration: duration,
            color: colour,
            cssClass: 'toast-message'
        });
        toast.present();
    }

    async presentModal(job: any) {
        console.log('presentModal', job)
        const modal = await this.modalCtrl.create({
            component: GameModalComponent,
            componentProps: {
                'job': job
            },
            cssClass: 'game-modal',
            animated: false,
        });

        modal.onDidDismiss().then((data) => {
            if (data.data) {
                let response = data.data as any;
                console.log(response);
            }
        });

        return await modal.present();
    }

    toggleForm() {
        console.log(this.toggleButton);
        this.showLoading = true;
        setTimeout(() => {
            if (this.formView === 'login') {
                this.formView = 'register';
                this.toggleFormText = { label: 'Already have an account?', button: 'Sign in' };
            } else if (this.formView === 'register') {
                this.formView = 'login';
                this.toggleFormText = { label: 'Don\'t have an account?', button: 'Sign up' };
            }
            this.showLoading = false;
        }, 500);
    }

    onLogin(user) {
        console.log('HomeComponent', user);

        if (user) {
            this.showForms = false;
            this.showLoading = true;
            let idx = this.saveData.accounts.findIndex(account => account.id === user.id);
            if (idx > -1) {
                // account already exists, use
                this.saveData.currentUser = this.saveData.accounts[idx];
            } else {
                // user exists but no account on device
                let userAccount = {
                    'id': user.id,
                    'user': user.user,
                    'pass': user.pass,
                    'cash': user.cash,
                    'web_cash': user.web_cash,
                    'exp': user.exp,
                    'level': user.level,
                    'jobs-completed': user.completed,
                    'jobs-failed': user.failed,
                    'active-jobs': [],
                    'job-data': {
                        'next-job-renewal': 0,
                        'jobs': []
                    }
                }
                console.log(userAccount)
                this.saveData.currentUser = userAccount;
                this.saveData.accounts.push(userAccount);
            }

            localStorage.setItem('saveData', JSON.stringify(this.saveData));

            setTimeout(() => {
                this.showLoading = false;
                this.showHome = true;
            }, 500);
        } else {
            // user not verified
            this.presentToast('Account not verified, try again', 2000, 'danger');
        }
    }

    onRegistration(event) {
        console.log('HomeComponent', event);
        this.showForms = false;
        this.showLoading = true;

        let userAccount = {
            'id': event.id,
            'user': event.user,
            'pass': event.pass,
            'cash': 0,
            'web_cash': 0,
            'exp': 0,
            'level': 1,
            'complete': 0,
            'failed': 0,
            'active-jobs': [],
            'job-data': {
                'next-job-renewal': 0,
                'jobs': []
            }
        }
        this.saveData.currentUser = userAccount;
        this.saveData.accounts.push(userAccount);
        // tbd: log user in - localstorage
        localStorage.setItem('saveData', JSON.stringify(this.saveData));

        setTimeout(() => {
            this.showLoading = false;
            this.showHome = true;
        }, 500);
    }
}