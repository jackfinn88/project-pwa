import { Component, Input, OnInit } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';

@Component({
    templateUrl: 'job-modal.component.html',
    styleUrls: ['./job-modal.component.scss']
})
export class JobModalComponent implements OnInit {
    jobId;
    job;
    view;
    canAdd;
    math = Math;

    constructor(private _navParams: NavParams, private _modalCtrl: ModalController) { }

    ngOnInit() {
        // add fake history to prevent navigation from hardware back button
        if (!window.history.state.modal) {
            const modalState = { modal: true };
            history.pushState(modalState, null);
        }

        this.job = this._navParams.get('job');
        this.jobId = parseInt(this._navParams.get('id'), 10);
        this.view = this._navParams.get('view');
        this.canAdd = this._navParams.get('can-add');
        console.log(this.job, this.jobId);

        // reverse-engineer for real date
        let dateFromCreated = new Date(this.job.created);
        this.job.sent = dateFromCreated.toLocaleTimeString() + ' - ' + dateFromCreated.toLocaleDateString();
    }

    // present modal for job item
    onAddButtonClick() {
        const data = { id: this.jobId, added: true, removed: false, job: this.job };

        this.closeModal(data);
    }

    // present modal for job item
    onRemoveButtonClick() {
        const data = { id: this.jobId, added: false, removed: true, job: this.job };

        this.closeModal(data);
    }

    async closeModal(data?) {
        // closing by button doesn't trigger autoclose overlay service
        // manually navigate from fake history
        history.back();
        await this._modalCtrl.dismiss(data);
    }
}