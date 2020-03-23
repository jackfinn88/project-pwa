import { Component, ViewChild, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { MapViewComponent } from 'src/app/components/map-view/map-view.component';
import { ModalController, ToastController } from '@ionic/angular';
import { JobModalComponent } from '../../components/job-modal/job-modal.component'
import { JobsService } from 'src/app/providers/job-service';
import { latLng } from 'leaflet';

@Component({
    templateUrl: 'jobs.component.html',
    styleUrls: ['./jobs.component.scss'],
})
export class JobsComponent implements OnInit, OnDestroy {
    @ViewChild(MapViewComponent, { static: false }) mapComponent: MapViewComponent;
    // flag to show loading spinner
    loaded = false;
    // general job information
    jobsMetaData;
    // current data regarding available jobs
    availableJobsData;
    // maximum available jobs
    maxJobAllowed = 5;
    // flag whther max has been reached
    maxJobsReached;
    // current collection
    availableJobsCollection = [];
    // timer to update remaining time
    updateInterval;
    // timestamp of next job creation
    nextJobRenewal;
    // timer to create next job
    nextJobTimer;
    // flag to restrict job creation to 1 at any time
    renewalInProcess = false;
    // countdown count for view
    countdown = 0;
    // timer to update countdown value for view
    countdownTimer;
    // player data
    playerData;
    // player's job collection
    playerJobsCollection = [];
    // for use in html data-binding
    math = Math;
    // data-binding to ion-segment value
    segment = 'available';

    constructor(public toastController: ToastController, public modalController: ModalController, private _location: Location, private _jobService: JobsService, private _cdr: ChangeDetectorRef) {
        // collect data for creation
        this.jobsMetaData = this._jobService.getData();
    }

    ngOnInit() {
        console.log('ngOnInit');
        this.setupJobData();
        this.setupPlayerData();

        this.maxJobsReached = this.availableJobsCollection.length < this.maxJobAllowed ? false : true;

        this.checkJobRenewal();

        // begin update loop
        this.updateInterval = setInterval(() => {
            this.updateAvailableJobs();
        }, 1000);
    }

    setupJobData() {
        console.log('setupJobData')
        // check job data in storage
        let jobDataFromStorage = JSON.parse(localStorage.getItem('jobs'));

        // create new object if none
        this.availableJobsData = jobDataFromStorage ? jobDataFromStorage : {
            'next-job-renewal': 0,
            'jobs': this.availableJobsCollection
        };

        // extract data
        this.nextJobRenewal = this.availableJobsData['next-job-renewal'];
        this.availableJobsCollection = this.availableJobsData['jobs'];
    }

    setupPlayerData() {
        console.log('setupPlayerData')
        // check job data in storage
        let playerDataFromStorage = JSON.parse(localStorage.getItem('player'));

        // create new object if none
        this.playerData = playerDataFromStorage ? playerDataFromStorage : {
            'active-jobs': this.playerJobsCollection
        };

        // extract data
        this.playerJobsCollection = this.playerData['active-jobs'];
    }

    // check past duration until next job
    checkJobRenewal() {
        console.log('checkJobRenewal')
        if (this.availableJobsCollection.length < this.maxJobAllowed) {
            let currentTime = Date.now();
            let remaining = this.nextJobRenewal - currentTime;
            let countdown = remaining > 0 ? remaining : 0;

            console.log(countdown)

            this.beginRenewal(countdown);
        }
    }

    // begin countdown until next job
    beginRenewal(countdown) {
        console.log('beginRenewal');
        console.log('next job in ', Math.floor(countdown / 1000), ' seconds');

        // capture when job should be created
        this.nextJobRenewal = Date.now() + countdown;

        if (!this.renewalInProcess) {
            this.countdown = Math.floor(countdown / 1000);
            this._cdr.detectChanges(); // required for updating view of data-binding
            // show countdown
            this.countdownTimer = setInterval(() => {
                this.countdown--;
                this._cdr.detectChanges(); // required for updating view of data-binding
            }, 1000);

            // block subsequent calls
            this.renewalInProcess = true;

            // store reference to clear later on
            this.nextJobTimer = setTimeout(() => {
                // unblock for next use
                this.renewalInProcess = false;
                clearInterval(this.countdownTimer);

                // create job if still required
                if (this.availableJobsCollection.length < this.maxJobAllowed) {
                    this.createJob();
                } else {
                    console.log('max jobs reached:', this.maxJobAllowed);
                }
            }, countdown);
        }
    }

    // update remaining time and clear expired jobs
    updateAvailableJobs() {
        console.log('updateAvailableJobs');
        let jobs;
        let currentTime = Date.now();

        // filter out expired jobs
        jobs = this.availableJobsData.jobs.filter((job) => {
            // update remaining time
            job.remaining = job.duration - (currentTime - job.created);
            // return if still active
            return job.duration - (currentTime - job.created) > 0;
        });

        this.availableJobsCollection = jobs;
        this._cdr.detectChanges(); // required for updating view of data-binding

        // if job is required i.e. one was removed
        if (this.availableJobsCollection.length < this.maxJobAllowed) {
            // start renewal countdown
            if (!this.renewalInProcess) {
                this.maxJobsReached = false;
                this._cdr.detectChanges();
                let countdown = Math.floor(Math.random() * 10000) + 5000;
                this.beginRenewal(countdown);
            }
        } else {

            this.maxJobsReached = true;
            this._cdr.detectChanges();
        }

        // remove loading spinner after first update
        if (!this.loaded) this.loaded = true;
    }

    addJobToCollection(job) {
        console.log('addJobToCollection', job);

        // filter out
        let jobs = this.availableJobsCollection.filter((availableJob) => {
            if (availableJob.created === job.created) this.playerJobsCollection.push(availableJob);
            return availableJob.created !== job.created;
        });
        if (this.availableJobsCollection.length === jobs.length) {
            this.presentToast('Job is no longer active', 2000, 'danger');
        }
        console.log(jobs)
        this.availableJobsCollection = jobs;
        this.saveJobData();
        this.savePlayerData();
        this._cdr.detectChanges(); // required for updating view of data-binding
    }

    removeJobFromCollection(id) {
        console.log('removeJobFromCollection');
        this.playerJobsCollection.splice(id, 1);
        this.savePlayerData();
        this._cdr.detectChanges(); // required for updating view of data-binding
    }

    // present modal for job item
    onJobItemClick(event) {
        // id is attached to srcElement from ngFor
        const id = event.srcElement.id;
        this.presentModal(id);
    }

    // create new available job
    createJob() {
        console.log('createJob');
        // map instance needs to be ready to retrieve random lat/lngs
        const mapIsReady = this.checkMapIsLoaded();

        if (!mapIsReady) {
            // wait one frame then call again
            requestAnimationFrame(() => {
                this.createJob();
            })
        } else {
            const currentTime = Date.now();
            const seconds = 60;
            let duration = seconds * 1000;

            const randMax = this.jobsMetaData.jobs.length;
            const rand = Math.floor(Math.random() * randMax);
            const randJob = this.jobsMetaData.jobs[rand];

            // const randDur = Math.floor(Math.random() * 60) + 40;
            // duration = randDur;

            const latlng = this.mapComponent.getRandomLatLng()

            this.availableJobsCollection.push({
                name: randJob.title,
                description: randJob.description,
                difficulty: randJob.difficulty,
                game: randJob.game,
                experience: randJob.exp,
                cash: randJob.cash,
                // add dynamic data
                created: currentTime,
                duration: duration,
                remaining: duration,
                lat: latlng.lat,
                lng: latlng.lng,
            });
            this._cdr.detectChanges(); // required for updating view of data-binding

            // save new job
            this.saveJobData();
        }
    }

    // check map component is ready
    checkMapIsLoaded(): boolean {
        return this.mapComponent && this.mapComponent.loaded;
    }

    // show job modal component
    async presentModal(jobId: number) {
        console.log('presentModal');
        const job = this.segment === 'available' ? this.availableJobsCollection[jobId] : this.playerJobsCollection[jobId];
        const modal = await this.modalController.create({
            component: JobModalComponent,
            componentProps: {
                'id': jobId,
                'job': job,
                'view': this.segment
            },
            cssClass: 'job-modal',
            animated: false,
            backdropDismiss: true
        });

        modal.onDidDismiss().then((data) => {
            if (data.data) {
                let response = data.data as any;
                if (response.added) {
                    this.addJobToCollection(response.job);
                } else if (response.removed) {
                    this.removeJobFromCollection(response.job);
                }
            }
        });
        return await modal.present();
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

    // store current data regarding available jobs
    saveJobData() {
        console.log('saveJobData');
        this.availableJobsData['next-job-renewal'] = this.nextJobRenewal;
        this.availableJobsData['jobs'] = this.availableJobsCollection;

        localStorage.setItem('jobs', JSON.stringify(this.availableJobsData));
    }

    // store current data regarding available jobs
    savePlayerData() {
        console.log('savePlayerData');
        this.playerData['active-jobs'] = this.playerJobsCollection;

        localStorage.setItem('player', JSON.stringify(this.playerData));
    }

    // callback for button
    goBack() {
        this._location.back();
    }

    // cleanup
    async ngOnDestroy() {
        // clear current timers
        clearInterval(this.countdownTimer);
        clearInterval(this.updateInterval);
        clearInterval(this.nextJobTimer);

        // save data
        this.saveJobData();

        // remove map object
        await this.mapComponent.destroy();

        // remove change detector
        this._cdr.detach();
    }
}