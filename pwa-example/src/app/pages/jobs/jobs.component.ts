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
    // flag whether max has been reached
    maxJobsReached;
    // current collection of available jobs
    availableJobsCollection = [];
    // timer to update remaining time
    updateInterval;
    // timestamp of next job creation
    nextJobRenewal;
    // timer to create next job
    nextJobTimer;
    // flag to restrict job creation to 1 at any time
    renewalInProcess = false;
    // countdown value for view
    countdown = 0;
    // timer to update countdown value for view
    countdownTimer;
    // player data
    playerData;
    // save data
    saveData;
    // player's active job collection
    playerJobsCollection = [];
    // to use Math within html data-binding
    math = Math;
    // data-binding to direct ion-segments default value
    segment = 'available';

    constructor(public toastController: ToastController, public modalController: ModalController, private _location: Location, private _jobService: JobsService, private _cdr: ChangeDetectorRef) {
        // collect data for creation
        this.jobsMetaData = this._jobService.getData();
    }

    ngOnInit() {
        this.setupData();

        this.maxJobsReached = this.availableJobsCollection.length < this.maxJobAllowed ? false : true;

        this.checkPastJobRenewal();

        // begin update loop
        this.updateInterval = setInterval(() => {
            this.updateAvailableJobs();
        }, 1000);
    }

    // collect player data for modification
    setupData() {
        this.saveData = JSON.parse(localStorage.getItem('saveData'));

        // get current available jobs and the last defined next renewal time
        this.availableJobsData = this.saveData.currentUser["job-data"];
        this.availableJobsCollection = this.availableJobsData['jobs'];
        this.nextJobRenewal = this.availableJobsData['next-job-renewal'];

        // get player's jobs
        this.playerData = this.saveData.currentUser;
        this.playerJobsCollection = this.playerData['active-jobs'];
    }

    // check past duration until next job
    checkPastJobRenewal() {
        let currentTime = Date.now();
        let remaining = this.nextJobRenewal - currentTime;
        let countdown;
        if (remaining > 0) {
            // renewal still in process
            countdown = remaining;
        } else {
            // renewal expired - create now
            countdown = 1250;

            // wait over 1000ms for first updateAvailableJobs loop to remove expired jobs
            // job creation will initially be blocked if collection shows the maximum of 5
            // yet they could all potentially be removed after the first loop due to expirations
            // resulting in no new job until after normal renewal process of 20-40 mins
        }

        this.beginRenewal(countdown);
    }

    // begin countdown until next job
    beginRenewal(countdown) {
        this.countdown = countdown;

        // capture when job should be created
        this.nextJobRenewal = Date.now() + countdown;

        if (!this.renewalInProcess) {
            this._cdr.detectChanges(); // required for updating view of data-binding
            // show countdown
            this.countdownTimer = setInterval(() => {
                this.countdown -= 1000;
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
                if (this.availableJobsCollection.length < this.maxJobAllowed) this.createJob();
            }, countdown);
        }
    }

    // update remaining time and clear expired jobs
    updateAvailableJobs() {
        let currentTime = Date.now();

        // filter out expired jobs
        let jobs = this.availableJobsData.jobs.filter((job) => {
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
                let milliseconds = { min: 300000, max: 600000 }; // 5-10 mins
                let duration = this.getRandomIntInclusive(milliseconds.min, milliseconds.max);
                this.beginRenewal(duration);
            }
        } else {
            this.maxJobsReached = true;
            this._cdr.detectChanges();
        }

        // remove loading spinner after first update
        if (!this.loaded) this.loaded = true;
    }

    addJobToCollection(job) {
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
        this.playerJobsCollection.splice(id, 1);
        this._cdr.detectChanges(); // required for updating view of data-binding

        this.save();
    }

    // present modal for job item
    onJobItemClick(event) {
        // id is attached to srcElement from ngFor
        const id = event.srcElement.id;
        setTimeout(() => {
            this.presentModal(id);
        }, 100);
    }

    // create new available job
    createJob() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                let userCoords = { 'lat': position.coords.latitude, 'lng': position.coords.longitude };

                // gather time data (how long job is available)
                let currentTime = Date.now();
                let milliseconds = { min: 900000, max: 1.2e+6 }; // 15-20 mins
                let duration = this.getRandomIntInclusive(milliseconds.min, milliseconds.max);

                // find available characters for player level
                let availableCharacters = this.jobsMetaData.characters.filter((character) => {
                    return character.unlocksAt <= this.playerData.level;
                });

                // character details
                let character = availableCharacters[this.getRandomIntInclusive(0, availableCharacters.length - 1)];
                let greeting = character.greetings[this.getRandomIntInclusive(0, character.greetings.length - 1)];
                let signoff = character.signoffs[this.getRandomIntInclusive(0, character.signoffs.length - 1)];
                let gameIdx = this.getRandomIntInclusive(0, character.problems.length - 1);
                let game = character.problems[gameIdx];

                // job
                let name = game.issue.subjects[this.getRandomIntInclusive(0, game.issue.subjects.length - 1)];
                let problem = game.issue.messages[this.getRandomIntInclusive(0, game.issue.messages.length - 1)];
                let description = greeting + ' ' + problem + ' ' + signoff;

                // rewards
                let min = character.cash.min / 100;
                let max = character.cash.max / 100;
                let cash = this.getRandomIntInclusive(min, max) * 100;
                min = character.exp.min / 100;
                max = character.exp.max / 100;
                let exp = this.getRandomIntInclusive(min, max) * 100;

                // generate random coords
                let centre = { 'lat': userCoords.lat, 'lng': userCoords.lng }; // user location is centre
                let radius = 400; // metres
                let latlng = this.randomLatLng(centre, radius);

                let type; // local/remote
                if (Math.random() > 0.3) {
                    type = 'Local';
                } else {
                    type = 'Remote';
                    cash = cash * .8; // remote jobs earn less
                    latlng = { 'lat': null, 'lng': null }; // null latlngs are populated by devices current position
                }

                let job = {
                    "name": name,
                    "description": description,
                    "gameIdx": gameIdx + 1,
                    "game": game,
                    "cash": cash,
                    "experience": exp,
                    "sender": character.name,
                    "type": type,
                    "created": currentTime,
                    "duration": duration,
                    "remaining": duration,
                    "lat": latlng.lat,
                    "lng": latlng.lng,
                    "colour": character.colour
                }

                this.availableJobsCollection.push(job);

                this._cdr.detectChanges(); // required for updating view of data-binding

                // save new job
                this.save();
            },
                (err) => {
                    // geolocation available but getCurrentPosition failed, wait 1 frame then try again
                    requestAnimationFrame(() => {
                        this.createJob();
                    })
                }
            );
        } else {
            this.presentToast('Geolocation is not supported', 2000, 'danger');
        }
    }

    // convert milliseconds to simple H:M:S format - https://stackoverflow.com/a/58826445/10166336
    timeConversion(duration) {
        let portions: string[] = [];

        let msInHour = 1000 * 60 * 60;
        let hours = Math.trunc(duration / msInHour);
        if (hours > 0) {
            portions.push(hours + 'h');
            duration = duration - (hours * msInHour);
        }

        let msInMinute = 1000 * 60;
        let minutes = Math.trunc(duration / msInMinute);
        if (minutes > 0) {
            portions.push(minutes + 'm');
            duration = duration - (minutes * msInMinute);
        }

        let seconds = Math.trunc(duration / 1000);
        if (seconds > 0) {
            portions.push(seconds + 's');
        }

        return portions.join(' ');
    }

    // generate random int between to values (including min and max)
    getRandomIntInclusive(minimum, maximum) {
        let min = Math.ceil(minimum);
        let max = Math.floor(maximum);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // calculate distance between 2 coordinates
    distance(lat1, lon1, lat2, lon2) {
        var R = 6371000;
        var a = 0.5 - Math.cos((lat2 - lat1) * Math.PI / 180) / 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * (1 - Math.cos((lon2 - lon1) * Math.PI / 180)) / 2;
        return R * 2 * Math.asin(Math.sqrt(a));
    }

    // find random latlng within given radius (without using map component) - https://stackoverflow.com/a/31280435/10166336
    randomLatLng(centre, radius) {
        var y0 = centre.lat;
        var x0 = centre.lng;
        var rd = radius / 111300; // about 111300 meters in one degree

        var u = Math.random();
        var v = Math.random();

        var w = rd * Math.sqrt(u);
        var t = 2 * Math.PI * v;
        var x = w * Math.cos(t);
        var y = w * Math.sin(t);

        // adjust the x-coordinate for the shrinking of the east-west distances
        var xp = x / Math.cos(y0);

        var newlat = y + y0;
        var newlon = xp + x0;

        return {
            lat: newlat.toFixed(5),
            lng: newlon.toFixed(5)
        };
    }

    // show job modal component
    async presentModal(jobId) {
        // which collection are we currently looking at
        let job = this.segment === 'available' ? this.availableJobsCollection[jobId] : this.playerJobsCollection[jobId];

        // create modal and pass relevant data via props
        let modal = await this.modalController.create({
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

        // add or remove job from user response
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
        let toast = await this.toastController.create({
            message: message,
            duration: duration,
            color: colour,
            cssClass: 'toast-message'
        });
        toast.present();
    }

    // update player data for storage
    save() {
        // assign player jobs
        this.playerData['active-jobs'] = this.playerJobsCollection;

        // assign available job data
        this.availableJobsData['next-job-renewal'] = this.nextJobRenewal;
        this.availableJobsData['jobs'] = this.availableJobsCollection;
        this.playerData["job-data"] = this.availableJobsData;

        // update currentUser
        this.saveData.currentUser = this.playerData;

        // update device accounts
        let idx = this.saveData.accounts.findIndex(account => account.id === this.playerData.id);
        this.saveData.accounts.splice(idx, 1, this.playerData);

        localStorage.setItem('saveData', JSON.stringify(this.saveData));
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