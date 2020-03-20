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
    math = Math;

    constructor(private _navParams: NavParams, private _modalCtrl: ModalController) { }

    ngOnInit() {
        this.job = this._navParams.get('job');
        this.jobId = parseInt(this._navParams.get('id'), 10);
        this.view = this._navParams.get('view');
        console.log(this.job, this.jobId)
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
        await this._modalCtrl.dismiss(data);
    }
}