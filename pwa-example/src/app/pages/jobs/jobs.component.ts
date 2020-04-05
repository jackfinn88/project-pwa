import { Component, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ModalController, ToastController } from '@ionic/angular';
import { JobModalComponent } from '../../components/job-modal/job-modal.component'
import { JobsService } from 'src/app/providers/job-service';

@Component({
    templateUrl: 'jobs.component.html',
    styleUrls: ['./jobs.component.scss'],
})
export class JobsComponent implements OnInit, OnDestroy {
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
    // save data
    saveData;
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
        this.setupData();

        this.maxJobsReached = this.availableJobsCollection.length < this.maxJobAllowed ? false : true;

        this.checkJobRenewal();

        // begin update loop
        this.updateInterval = setInterval(() => {
            this.updateAvailableJobs();
        }, 1000);
    }

    setupData() {
        this.saveData = JSON.parse(localStorage.getItem('saveData'));

        this.availableJobsData = this.saveData.currentUser["job-data"];
        this.nextJobRenewal = this.availableJobsData['next-job-renewal'];
        this.availableJobsCollection = this.availableJobsData['jobs'];

        this.playerData = this.saveData.currentUser;
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
        // use filter to check job exists AND:
        let jobs = this.availableJobsCollection.filter((availableJob) => {
            // a) add to player jobs collection
            if (availableJob.created === job.created) this.playerJobsCollection.push(availableJob);
            // b) remove from available jobs collection
            return availableJob.created !== job.created;
        });

        // if a job was removed while modal was open, it could not have been filtered - lengths will match
        if (this.availableJobsCollection.length === jobs.length) {
            this.presentToast('Job is no longer active', 2000, 'danger');
        } else { // job was added to player - lengths won't match
            // update available collection
            this.availableJobsCollection = jobs;
            this._cdr.detectChanges(); // required for updating view of data-binding

            this.save();
        }
    }

    removeJobFromCollection(id) {
        console.log('removeJobFromCollection');
        this.playerJobsCollection.splice(id, 1);
        this._cdr.detectChanges(); // required for updating view of data-binding

        this.save();
    }

    // present modal for job item
    onJobItemClick(event) {
        console.log('onJobItemClick', event);
        // id is attached to srcElement from ngFor
        const id = event.srcElement.id;
        setTimeout(() => {
            this.presentModal(id);
        }, 100);
    }

    // create new available job
    createJob() { // tbd: reinstate geolocation
        console.log('createJob');
        let userCoords = { 'lat': 50.8579, 'lng': 0.5767 };
        // if (navigator.geolocation) {
        // navigator.geolocation.getCurrentPosition((position) => {
        // gather time data
        let currentTime = Date.now();
        let seconds = 60;
        let duration = seconds * 1000;

        // generate random job
        let randMax = this.jobsMetaData.jobs.length;
        let rand = Math.floor(Math.random() * randMax);
        let randJob = this.jobsMetaData.jobs[rand];

        // let randDur = Math.floor(Math.random() * 60) + 40;
        // duration = randDur;

        // generate random coords
        // let centre = { 'lat': position.coords.latitude, 'lng': position.coords.latitude }; // user location is centre
        let centre = { 'lat': userCoords.lat, 'lng': userCoords.lng }; // user location is centre
        let radius = 1000; // metres
        let latlng = this.randomLatLng(centre, radius);

        let sender;
        if (Math.random() > 0.5) {
            sender = 'Lester';
            randJob.colour = 'green';
        } else {
            sender = 'Unknown';
            randJob.colour = 'gray';
        }
        let type;
        if (Math.random() > 0.3) {
            type = 'Local';
        } else {
            type = 'Remote';
            randJob.cash = randJob.cash * .8;
            latlng = userCoords;
        }
        console.log('type:', type, randJob.cash);

        this.availableJobsCollection.push({
            name: randJob.title,
            description: randJob.description,
            difficulty: randJob.difficulty,
            game: randJob.game,
            experience: randJob.exp,
            cash: randJob.cash,
            // add dynamic data
            sender: sender,
            type: type,
            created: currentTime,
            duration: duration,
            remaining: duration,
            lat: latlng.lat,
            lng: latlng.lng,
            colour: randJob.colour
        });
        this._cdr.detectChanges(); // required for updating view of data-binding

        // save new job
        this.save();
        /*},
            (err) => {
                // geolocation available but getCurrentPosition failed, wait 1 frame then try again
                requestAnimationFrame(() => {
                    this.createJob();
                })
            }
        );
    } else {
        this.presentToast('Geolocation is not supported', 2000, 'danger');
    }*/
    }

    //Calc the distance between 2 coordinates as the crow flies
    distance(lat1, lon1, lat2, lon2) {
        var R = 6371000;
        var a = 0.5 - Math.cos((lat2 - lat1) * Math.PI / 180) / 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * (1 - Math.cos((lon2 - lon1) * Math.PI / 180)) / 2;
        return R * 2 * Math.asin(Math.sqrt(a));
    }

    randomLatLng(center, radius) {
        var y0 = center.lat;
        var x0 = center.lng;
        var rd = radius / 111300; //about 111300 meters in one degree

        var u = Math.random();
        var v = Math.random();

        var w = rd * Math.sqrt(u);
        var t = 2 * Math.PI * v;
        var x = w * Math.cos(t);
        var y = w * Math.sin(t);

        //Adjust the x-coordinate for the shrinking of the east-west distances
        var xp = x / Math.cos(y0);

        var newlat = y + y0;
        var newlon = xp + x0;

        return {
            lat: newlat.toFixed(5),
            lng: newlon.toFixed(5)
        };
    }

    // show job modal component
    async presentModal(jobId: number) {
        console.log('presentModal', jobId);
        const job = this.segment === 'available' ? this.availableJobsCollection[jobId] : this.playerJobsCollection[jobId];
        console.log('JOB', job);
        const modal = await this.modalController.create({
            component: JobModalComponent,
            componentProps: {
                'id': jobId,
                'job': job,
                'view': this.segment,
                'can-add': this.playerJobsCollection.length < this.maxJobAllowed ? true : false
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
                    this.removeJobFromCollection(jobId);
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

    save() {
        this.playerData['active-jobs'] = this.playerJobsCollection;
        this.availableJobsData['next-job-renewal'] = this.nextJobRenewal;
        this.availableJobsData['jobs'] = this.availableJobsCollection;

        this.playerData["job-data"] = this.availableJobsData;

        this.saveData.currentUser = this.playerData;

        let idx = this.saveData.accounts.findIndex(account => account.id === this.playerData.id);
        this.saveData.accounts.splice(idx, 1, this.playerData);

        localStorage.setItem('saveData', JSON.stringify(this.saveData));

        console.log('save', this.playerData);
    }

    // callback for button
    goBack() {
        this._location.back();
    }

    // cleanup
    ngOnDestroy() {
        // clear current timers
        clearInterval(this.countdownTimer);
        clearInterval(this.updateInterval);
        clearInterval(this.nextJobTimer);

        // save data
        this.save();

        // remove change detector
        this._cdr.detach();
    }
}