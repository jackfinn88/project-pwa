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
    showTutorial = false;
    slideOpts = {
        speed: 300
    }

    constructor(public modalCtrl: ModalController, public toastCtrl: ToastController) { }

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
        const toast = await this.toastCtrl.create({
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
        console.log('onLogin', user);

        if (user) {
            this.showForms = false;
            this.showLoading = true;

            // check if user account already exists on device storage
            let idx = this.saveData.accounts.findIndex(account => account.id === user.id);

            // define initial account details
            let userAccount = {
                'id': user.id,
                'user': user.user,
                'pass': user.pass,
                'cash': user.ph_cash,
                'webcash': user.lto_cash,
                'exp': user.ph_exp,
                'total-exp': user.ph_total_exp,
                'level': user.ph_level,
                'jobs-completed': user.ph_completed,
                'jobs-failed': user.ph_failed,
                'active-jobs': [],
                'job-data': {
                    'next-job-renewal': 0,
                    'jobs': []
                },
                'game-data': {
                    'blitz': {
                        'upgrades': [
                            {
                                'level': user.ph_game01_upgrade01_level,
                                'active': user.ph_game01_upgrade01_active,
                            },
                            {
                                'level': user.ph_game01_upgrade02_level,
                                'active': user.ph_game01_upgrade02_active,
                            }
                        ],
                        'dual-use': user.ph_game01_dual
                    },
                    'fallproof': {
                        'upgrades': [
                            {
                                'level': user.ph_game02_upgrade01_level,
                                'active': user.ph_game02_upgrade01_active,
                            },
                            {
                                'level': user.ph_game02_upgrade02_level,
                                'active': user.ph_game02_upgrade02_active,
                            }
                        ],
                        'dual-use': user.ph_game02_dual
                    }
                }
            };
            let showTutorial = false;
            if (idx > -1) {
                // account exists on device, use job data
                userAccount["active-jobs"] = this.saveData.accounts[idx]["active-jobs"];
                userAccount["job-data"] = this.saveData.accounts[idx]["job-data"];

                // update save data
                this.saveData.currentUser = userAccount;
                this.saveData.accounts[idx] = userAccount;
            } else {
                // user exists but no account on device, so store
                this.saveData.currentUser = userAccount;
                this.saveData.accounts.push(userAccount);

                // show tutorial
                showTutorial = true;
            }

            localStorage.setItem('saveData', JSON.stringify(this.saveData));
            localStorage.setItem('account', JSON.stringify(user));

            setTimeout(() => {
                this.showLoading = false;
                if (showTutorial) {
                    this.showTutorial = true;
                } else {
                    this.showHome = true;
                }
            }, 500);
        } else {
            // user not verified
            this.presentToast('Account not verified, try again', 2000, 'danger');
        }
    }

    endTutorial() {
        this.showLoading = true;
        this.showTutorial = false;

        setTimeout(() => {
            this.showLoading = false;
            this.showHome = true;
        }, 500);
    }

    onRegistration(user) {
        console.log('onRegistration', user);

        if (user) {
            this.showForms = false;
            this.showLoading = true;

            // store user record as new device account
            let userAccount = {
                'id': user.id,
                'user': user.user,
                'pass': user.pass,
                'cash': user.ph_cash,
                'webcash': user.lto_cash,
                'exp': user.ph_exp,
                'total-exp': user.ph_total_exp,
                'level': user.ph_level,
                'jobs-completed': user.ph_completed,
                'jobs-failed': user.ph_failed,
                'active-jobs': [],
                'job-data': {
                    'next-job-renewal': 0,
                    'jobs': []
                },
                'game-data': {
                    'blitz': {
                        'upgrades': [
                            {
                                'level': user.ph_game01_upgrade01_level,
                                'active': user.ph_game01_upgrade01_active,
                            },
                            {
                                'level': user.ph_game01_upgrade02_level,
                                'active': user.ph_game01_upgrade02_active,
                            }
                        ],
                        'dual-use': user.ph_game01_dual
                    },
                    'fallproof': {
                        'upgrades': [
                            {
                                'level': user.ph_game02_upgrade01_level,
                                'active': user.ph_game02_upgrade01_active,
                            },
                            {
                                'level': user.ph_game02_upgrade02_level,
                                'active': user.ph_game02_upgrade02_active,
                            }
                        ],
                        'dual-use': user.ph_game02_dual
                    }
                }
            }
            this.saveData.currentUser = userAccount;
            this.saveData.accounts.push(userAccount);

            localStorage.setItem('saveData', JSON.stringify(this.saveData));
            localStorage.setItem('account', JSON.stringify(user));

            setTimeout(() => {
                this.showLoading = false;
                this.showTutorial = true;
            }, 500);
        } else {
            // user not registered
            this.presentToast('Registration failed, try again', 2000, 'danger');
        }
    }

    copyTextToClipboard(val: string) {
        const selBox = document.createElement('textarea');
        selBox.style.position = 'fixed';
        selBox.style.left = '0';
        selBox.style.top = '0';
        selBox.style.opacity = '0';
        selBox.innerText = val;
        document.body.appendChild(selBox);
        selBox.focus();
        selBox.select();
        document.execCommand('copy');
        document.body.removeChild(selBox);

        this.presentToast('Copied to clipboard', 3000, 'medium');
    }
}