import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Location } from '@angular/common';
import { AlertController } from '@ionic/angular';
import { ApiService } from 'src/app/providers/api.service';

@Component({
    templateUrl: 'inventory.component.html',
    styleUrls: ['./inventory.component.scss'],
})
export class InventoryComponent implements OnInit {
    saveData;
    account;
    player;
    availablePlugins;
    pluginKeys;
    parseInt = parseInt;
    prices = [2500, 5000, 10000];
    descriptions = [
        "Increase Data Corruption",
        "Descrease Transfer Speed",
        "Increase Time in Networks",
        "Increase Available Rotations"
    ]

    constructor(private _location: Location, private _apiService: ApiService, private alertCtrl: AlertController, private _cdr: ChangeDetectorRef) { }

    ngOnInit() {
        this.saveData = JSON.parse(localStorage.getItem('saveData'));
        this.account = JSON.parse(localStorage.getItem('account'));
        this.player = this.saveData.currentUser;

        // just pull collection to mutate - reassign before updating storage
        this.pluginKeys = Object.keys(this.player["game-data"]);
        this.availablePlugins = this.pluginKeys.map((key) => {
            return this.player["game-data"][key];
        });

        // some elements require bool types - for binding
        this.availablePlugins.forEach((plugin) => {
            // convert int to bool for some properties - reassign before updating storage
            plugin.upgrades.forEach(upgrade => {
                upgrade.level = parseInt(upgrade.level, 10);
                upgrade.active = parseInt(upgrade.active, 10) ? true : false;
            });
        });
    }

    ngAfterViewInit() {
        // update descriptions here due to seperated ngFor loops splitting the array order
        let items = document.querySelectorAll('.description-text');
        items.forEach((item, idx) => {
            item.textContent = this.descriptions[idx];
        });
    }

    purchaseUpgrade(pluginIdx, upgradeIdx) {
        let upgrade = this.availablePlugins[pluginIdx].upgrades[upgradeIdx];
        let header = 'Purchase';
        let message;
        let buttons = [];
        let amount = this.prices[upgrade.level];
        if (this.player.cash < amount) {
            message = 'You do not have enough <strong>Cash</strong> to purchase this upgrade';
            buttons = [{
                text: 'Cancel',
                role: 'cancel'
            }];
        } else {
            message = 'Are you sure you want to spend £<strong>' + amount + '</strong> to purchase this upgrade?'
            buttons = [
                {
                    text: 'Cancel',
                    role: 'cancel'
                },
                {
                    text: 'Confirm',
                    handler: () => {
                        this.confirmUpgradePurchase(pluginIdx, upgradeIdx, amount);
                    }
                }
            ];
        }

        this.presentAlertConfirm(header, message, buttons);
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

    confirmUpgradePurchase(pluginIdx, upgradeIdx, amount) {
        let upgrade = this.availablePlugins[pluginIdx].upgrades[upgradeIdx];
        let currentLevel = parseInt(upgrade.level, 10);
        upgrade.level = currentLevel + 1;
        this.availablePlugins[pluginIdx].upgrades[upgradeIdx] = upgrade;
        this.player.cash -= amount;

        this.updateRecord();
    }

    confirmDualPurchase(pluginIdx, amount) {
        this.availablePlugins[pluginIdx]["dual-use"] = 1;
        this.player.cash -= amount;

        this.updateRecord();
    }

    onToggleChange(pluginIdx, upgradeIdx) {
        // only perform check when toggle is on
        if (!this.availablePlugins[pluginIdx].upgrades[upgradeIdx].active) return;

        let otherIdx = upgradeIdx > 0 ? 0 : 1;

        // can player use both upgrades?
        if (!parseInt(this.availablePlugins[pluginIdx]["dual-use"], 10)) {
            // if not - check whether other upgrade is active?
            if (this.availablePlugins[pluginIdx].upgrades[otherIdx].active) {
                // if so - ask to purchase dual-use
                let amount = this.prices[1];
                let header = 'Purchase';
                let message = 'You are currently only allowed 1 upgrade per <strong>Plug-in</strong>. Purchase dual-use for £<strong>' + amount + '</strong> to have both active?';
                let buttons = [
                    {
                        text: 'Cancel',
                        role: 'cancel',
                        handler: () => {
                            // purchase declined - toggle other upgrade off
                            this.availablePlugins[pluginIdx].upgrades[otherIdx].active = false;
                        }
                    },
                    {
                        text: 'Confirm',
                        handler: () => {
                            // purchase confirmed - check cash
                            if (this.player.cash >= amount) {
                                // purchase ok
                                this.confirmDualPurchase(pluginIdx, amount);
                            } else {
                                // not enough cash - toggle other upgrade off
                                let message = 'You do not have enough <strong>Cash</strong> to purchase this upgrade';
                                let buttons = [{
                                    text: 'Cancel',
                                    role: 'cancel',
                                    handler: () => {
                                        this.availablePlugins[pluginIdx].upgrades[otherIdx].active = false;
                                    }
                                }];
                                this.presentAlertConfirm(header, message, buttons);
                            }
                        }
                    }];

                this.presentAlertConfirm(header, message, buttons);
            }
        }
    }

    updateRecord() {
        this.availablePlugins.forEach((plugin, idx) => {
            // convert some bools back to ints for db
            plugin.upgrades.forEach(upgrade => {
                upgrade.active = upgrade.active ? 1 : 0;
            });
            this.player["game-data"][this.pluginKeys[idx]] = plugin;
        });
        this.saveData.currentUser = this.player;

        // update database
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
            ph_game01_upgrade01_level: this.saveData.currentUser["game-data"].blitz.upgrades[0].level,
            ph_game01_upgrade02_level: this.saveData.currentUser["game-data"].blitz.upgrades[1].level,
            ph_game02_upgrade01_level: this.saveData.currentUser["game-data"].fallproof.upgrades[0].level,
            ph_game02_upgrade02_level: this.saveData.currentUser["game-data"].fallproof.upgrades[1].level,
            ph_game01_upgrade01_active: this.saveData.currentUser["game-data"].blitz.upgrades[0].active,
            ph_game01_upgrade02_active: this.saveData.currentUser["game-data"].blitz.upgrades[1].active,
            ph_game02_upgrade01_active: this.saveData.currentUser["game-data"].fallproof.upgrades[0].active,
            ph_game02_upgrade02_active: this.saveData.currentUser["game-data"].fallproof.upgrades[1].active,
            ph_game01_dual: this.saveData.currentUser["game-data"].blitz["dual-use"],
            ph_game02_dual: this.saveData.currentUser["game-data"].fallproof["dual-use"],
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

        // update db
        this._apiService.updateRecord(record).subscribe((record) => {
            // update device accounts
            let accountIdx = this.saveData.accounts.findIndex(account => account.id === this.saveData.currentUser.id);
            this.saveData.accounts.splice(accountIdx, 1, this.saveData.currentUser);

            localStorage.setItem('saveData', JSON.stringify(this.saveData));
        });
    }

    goBack() {
        this._location.back();
    }

    ngOnDestroy() {
        this.updateRecord();
    }
}