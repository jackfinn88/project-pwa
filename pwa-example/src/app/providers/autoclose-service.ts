import { Injectable } from '@angular/core';
import { ActionSheetController, PopoverController, ModalController, MenuController } from '@ionic/angular';

@Injectable({
    providedIn: 'root'
})
export class AutocloseOverlaysService {
    constructor(
        private actionSheetCtrl: ActionSheetController,
        private popoverCtrl: PopoverController,
        private modalCtrl: ModalController,
        private menu: MenuController,
    ) { }

    async trigger() {
        // close action sheet
        try {
            const element = await this.actionSheetCtrl.getTop();
            if (element) {
                element.dismiss();
                return;
            }
        } catch (error) {
            console.error(error);
        }

        // close popover
        try {
            const element = await this.popoverCtrl.getTop();
            if (element) {
                element.dismiss();
                return;
            }
        } catch (error) {
            console.error(error);
        }

        // close modal
        try {
            const element = await this.modalCtrl.getTop();
            if (element) {
                element.dismiss();
                return;
            }
        } catch (error) {
            console.error(error);
        }

        // close side menua
        try {
            const element = await this.menu.getOpen();
            if (element !== null) {
                this.menu.close();
                return;
            }
        } catch (error) {
            console.error(error);
        }
    }
}
