import { Component, OnInit, ViewChild, ElementRef, OnDestroy, Output, EventEmitter } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { Router } from '@angular/router';
import { ToastController, ModalController } from '@ionic/angular';
import { GameModalComponent } from '../game-modal/game-modal.component';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from 'src/app/providers/api.service';

@Component({
    selector: 'app-map-view',
    templateUrl: './map-view.component.html',
    styleUrls: ['./map-view.component.scss']
})
export class MapViewComponent implements OnInit, OnDestroy {
    @Output() storageUpdate = new EventEmitter();
    @ViewChild('map', { read: ElementRef, static: false }) mapElementRef: ElementRef;
    accessToken = 'pk.eyJ1IjoiZmlubmphY2stZ2IiLCJhIjoiY2s3bmowbTJoMGUyajNsbTc5Y3ZhemtqNCJ9.qaNK4anI5YokbSKxUXpNWQ'; // openstreetmaps - tbd - remove
    loaded = false;
    mapElement: HTMLElement;
    map;
    userLocation;
    routingControl;
    circles = [];
    currentWaypoint;
    currentPopup;
    jobMarkers = [];
    saveData;
    account;
    player;
    playerJobsCollection;
    levelThresholds = [1000, 2500, 5000, 7500, 10000, 15000, 25000, 35000, 50000, 100000, 125000, 150000, 175000, 200000, 250000, 400000, 600000, 850000, 1000000];

    // custom icon
    markerIcon = L.icon({
        iconUrl: 'assets/icons/custom/map-marker.png',
        shadowUrl: 'assets/icons/custom/map-marker-shadow.png',

        iconSize: [30, 45], // size of the icon
        shadowSize: [42, 34], // size of the shadow
        iconAnchor: [15, 45], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 34],  // the same for the shadow
    });
    modalCommunicationSubject;

    constructor(public modalCtrl: ModalController, public toastController: ToastController, private _router: Router, private _apiService: ApiService) {
        // create subject for game modal to ensure communication on modal destroy
        this.modalCommunicationSubject = new BehaviorSubject(null);
    }

    ngOnInit() {
        this.getLocation();
        this.getPlayerData();
    }

    getPlayerData() {
        console.log('setupPlayerData')
        // get data from storage
        this.saveData = JSON.parse(localStorage.getItem('saveData'));
        this.account = JSON.parse(localStorage.getItem('account'));
        this.player = this.saveData.currentUser;

        // extract data
        this.playerJobsCollection = this.player['active-jobs'];
    }


    // store current data regarding available jobs
    save() {
        console.log('save');
        this.player['active-jobs'] = this.playerJobsCollection;
        this.saveData.currentUser = this.player;

        localStorage.setItem('saveData', JSON.stringify(this.saveData));
        this.storageUpdate.emit({ player: this.player });
        this.updateRecord();
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


    getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                this.userLocation = new L.LatLng(position.coords.latitude, position.coords.longitude);
                console.log(this.userLocation)
                this.initializeMap();
            });
        } else {
            console.error("Geolocation is not supported by this browser.");
        }
    }


    initializeMap(): void {
        console.log("initializeMap");
        const options = {
            maxZoom: 15,
            minZoom: 13,
            zoomControl: false
        }
        // map instance
        this.map = new L.Map('map', options);

        // http://leaflet-extras.github.io/leaflet-providers/preview/
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 15
        }).addTo(this.map);

        this.map.on('click', (event) => {
            console.log("click", event);
            var coord = (event as any).latlng;
            var lat = coord.lat;
            var lng = coord.lng;
            console.log("You clicked the map at latitude: " + lat + " and longitude: " + lng);
        });

        this.map.on('locationerror', (event) => {
            this.onLocationError(event);
        });

        this.map.on('locationfound', (event) => {
            this.onLocationFound(event);
        });

        setTimeout(() => {
            this.showDeviceLocation();
            this.mapElement = this.mapElementRef.nativeElement;
            this.loaded = true;
        }, 1000);

    }

    markLocations(): void {
        console.log('markLocations');
        this.jobMarkers.forEach((marker) => {
            marker.remove();
        })
        setTimeout(() => {
            let marker: L.Marker;
            this.jobMarkers = [];
            this.playerJobsCollection.forEach((job, idx) => {
                console.log('markLocations', job);
                let coords = (job.lat && job.lng) ? { lat: job.lat, lng: job.lng } : { lat: this.userLocation.lat, lng: this.userLocation.lng };
                job.lat = coords.lat;
                job.lng = coords.lng;
                marker = L.marker([job.lat, job.lng], { icon: this.markerIcon }).on('click', () => { this.onMarkerClick(job, idx) }).addTo(this.map);
                this.jobMarkers.push(marker);
            });
        }, 500);
    }

    showDeviceLocation(): void {
        console.log('showDeviceLocation');
        // setView once to get initial map location
        if (this.map) this.map.locate({ setView: true, watch: true });
        setTimeout(() => {
            if (this.map) this.map.stopLocate();
            if (this.map) this.map.locate({ watch: true });
        }, 1000);

        this.markLocations();
    }

    showWaypoint(job: any): void {
        if (this.currentWaypoint) {
            this.currentWaypoint.popup.closePopup();
            this.removeRouteControl();
        };

        let latLng = { 'lat': job.lat, 'lng': job.lng };
        const popupContent = job.title + '<br>' + job.description;
        const popup = L.popup()
            .setLatLng(latLng)
            .setContent(popupContent);

        this.currentWaypoint = {
            id: '1',
            control: this.createRouteControl([this.userLocation.lat, this.userLocation.lng], [latLng.lat, latLng.lng]),
            popup: popup
        }

        requestAnimationFrame(() => {
            this.clearWaypointMarkers();
        });
    }

    clearWaypointMarkers() {
        // route control appends 2 markers with void sources regardless of the success of its request - remove n amount that may have been added
        let markers = Array.from(this.mapElement.querySelector('.leaflet-marker-pane').querySelectorAll('.leaflet-marker-icon'));
        // collect all but splice actual player markers out to only remove the n that have been added from routing
        markers.splice(0, this.playerJobsCollection.length);
        markers.forEach((marker) => {
            marker.remove();
        });
    }

    onMarkerClick(job, collectionIdx) {
        let content = this.createPopupContent(job, collectionIdx);
        L.popup()
            .setLatLng([job.lat, job.lng])
            .setContent(content).openOn(this.map);
    }

    async presentModal(job, collectionIdx) {
        const modal = await this.modalCtrl.create({
            component: GameModalComponent,
            componentProps: {
                'job': job,
                'collectionId': collectionIdx,
                'subject': this.modalCommunicationSubject,
                'player': this.player
            },
            cssClass: 'game-modal',
            animated: false,
        });

        modal.onDidDismiss().then(() => {
            let data = this.modalCommunicationSubject._value;
            if (data["game-started"] === true) {
                let player = this.player;
                let message, colour;
                if (data["game-won"] === true) {
                    // game win
                    message = 'Job completed. Cash: +£' + job["cash"] + ' / XP: +' + job["experience"] + '.';
                    colour = 'success';

                    player["jobs-completed"] = parseInt(player["jobs-completed"], 10) + 1;
                    player["cash"] = parseInt(player["cash"], 10) + job["cash"];

                    // tally up xp and check for level up
                    let totalXp = parseInt(player["total-exp"], 10);
                    let currentXp = parseInt(player["exp"], 10);
                    let currentLevel = parseInt(player["level"], 10);
                    let jobXp = job["experience"];
                    if (currentXp + jobXp >= this.levelThresholds[currentLevel - 1]) {
                        // level up
                        let diff = (currentXp + jobXp) - this.levelThresholds[currentLevel - 1];
                        currentXp = diff;
                        currentLevel++;

                        // tbd: check extra level up from xp
                        // if (diff > this.levelThresholds[currentLevel]) // level up again

                        // notify user
                        setTimeout(() => {
                            this.presentToast('Congratulations! You are now Level ' + currentLevel + '!', 3000, 'warning');
                        }, 3500);
                    } else {
                        currentXp += jobXp;
                    }
                    totalXp += jobXp;
                    player["exp"] = currentXp;
                    player["total-exp"] = totalXp;
                    player["level"] = currentLevel;
                } else {
                    // game lose
                    message = 'Job failed, better luck next time.';
                    colour = 'danger';
                    player["jobs-failed"] = parseInt(player["jobs-failed"], 10) + 1;
                }
                this.player = player;

                this.removeJobFromCollection(collectionIdx);
                this.markLocations();
                this.presentToast(message, 2000, colour);

                this.save();
            }
        });

        return await modal.present();
    }

    removeJobFromCollection(id) {
        console.log('removeJobFromCollection');
        this.playerJobsCollection.splice(id, 1);
    }

    createPopupContent(job, collectionIdx) {
        const container = document.createElement('div'),
            titleText = document.createElement('p'),
            senderText = document.createElement('p'),
            rewardText = document.createElement('p'),
            gameText = document.createElement('p'),
            btnContainer = document.createElement('ion-buttons'),
            waypointBtn = document.createElement('ion-button'),
            playGameBtn = document.createElement('ion-button');

        titleText.textContent = job.name;
        senderText.textContent = 'Sent by: ' + job.sender;
        rewardText.textContent = 'Rewards: £' + job.cash + '  /  XP: ' + job.experience;
        gameText.textContent = 'Plug-in: ' + (job.gameIdx < 2 ? 'blitz.exe' : 'fallproof.exe');

        container.appendChild(titleText);
        container.appendChild(senderText);
        container.appendChild(rewardText);
        container.appendChild(gameText);

        waypointBtn.textContent = 'Waypoint';
        waypointBtn.onclick = () => {
            this.showWaypoint(job);
        }

        playGameBtn.textContent = 'Play';
        // playGameBtn.disabled = !this.playerJobsCollection[collectionIdx].inRange;
        playGameBtn.onclick = () => {
            this.presentModal(job, collectionIdx);
            this.map.closePopup();
        }

        btnContainer.appendChild(waypointBtn);
        btnContainer.appendChild(playGameBtn);

        container.classList.add('popup-container');

        container.appendChild(btnContainer);

        return container;
    }

    onLocationError(event) {
        console.error(event.type, event.message);
        setTimeout(() => {
            this.showDeviceLocation();
        }, 500);
    }

    onLocationFound(event) {
        console.log(event.type);
        // capture location
        this.userLocation = new L.LatLng(event.latlng.lat, event.latlng.lng);

        this.clearCircles();
        this.addCircle(event.latlng, 50);

        this.checkRangeFromLocations();
    }

    checkRangeFromLocations() {
        console.log('checkRangeFromLocations');
        this.playerJobsCollection.forEach((job, idx) => {
            let coords = new L.LatLng(job.lat, job.lng);
            const distanceMeters = Math.round(this.userLocation.distanceTo(coords) * 1e2) / 1e2;
            job.inRange = distanceMeters <= 50 ? true : false; // user must be within 50m of job location
        });
    }
    iframeSrc;
    handleRoutingError(event) {
        console.error(event);
        this.iframeSrc = event.error.url;
        this.presentToast('Error finding route', 2000, 'danger');
    }

    createRouteControl(start, end) {
        return new L.Routing.Control({
            autoRoute: true,
            waypoints: [
                L.latLng(start[0], start[1]),
                L.latLng(end[0], end[1])
            ],
            routeWhileDragging: false,
            lineOptions: {
                styles: [{ color: 'purple', opacity: 1, weight: 5 }]
            }
        }).on('routingerror', (e) => {
            console.log('routingerror');
            this.handleRoutingError(e);
        }).addTo(this.map);
    }

    removeRouteControl() {
        this.map.removeControl(this.currentWaypoint.control);
        this.currentWaypoint = null;
    }

    addCircle(latlng, radius) {
        this.circles.push(L.circle(latlng, radius).addTo(this.map));
    }

    removeCircle(circleId) {
        if (this.circles[circleId] != undefined) {
            this.map.removeLayer(this.circles[circleId]);
        };
    }

    clearCircles() {
        console.log('clearCircles')
        if (this.circles) {
            this.circles.forEach((circle) => {
                circle.remove();
            });
            this.circles = [];
        }
    }

    destroy() {
        console.log('destroy');
        return new Promise((resolve) => {
            this.map.stopLocate();
            this.map.remove();
            // clear property once removed - to stem outside destroy calls from parent components
            this.map = null;
            resolve();
        })
    }

    async ngOnDestroy() {
        console.log('ngOnDestroy');
        // calls may be triggered before destroy - check map first
        if (this.map) await this.destroy();
    }

    updateRecord() {
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

        this._apiService.updateRecord(record).subscribe((record) => {
            // update device accounts
            let accountIdx = this.saveData.accounts.findIndex(account => account.id === this.saveData.currentUser.id);
            this.saveData.accounts.splice(accountIdx, 1, this.saveData.currentUser);

            localStorage.setItem('saveData', JSON.stringify(this.saveData));
        });
    }
}

export interface IWaypoint {
    id: string;
    control: L.Routing.Control;
    popup: L.Popup;
}

export interface IJob {
    id: string;
    title: string;
    description: string;
    lat: number;
    lng: number;
    inRange: boolean;
}