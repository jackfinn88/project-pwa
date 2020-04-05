import { Component, OnInit, ViewChild, ElementRef, OnDestroy, Output, EventEmitter } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { Router } from '@angular/router';
import { ToastController, ModalController } from '@ionic/angular';
import { GameModalComponent } from '../game-modal/game-modal.component';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from 'src/app/providers/api.service';
import { Record } from 'src/app/util/record';

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
    circles;
    currentWaypoint;
    currentPopup;
    jobMarkers = [];
    saveData;
    player;
    playerJobsCollection;

    markerIcon = L.icon({
        iconUrl: 'assets/icons/custom/map-marker.png',
        shadowUrl: 'assets/icons/custom/map-marker-shadow.png',

        iconSize: [38, 56], // size of the icon
        shadowSize: [42, 34], // size of the shadow
        iconAnchor: [20, 56], // point of the icon which will correspond to marker's location
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
        this.player = this.saveData.currentUser;

        // extract data
        this.playerJobsCollection = this.player['active-jobs'];
    }


    // store current data regarding available jobs
    save() {
        console.log('save');
        // this.saveData.currentUser['active-jobs'] = this.playerJobsCollection;
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
                // this.userLocation = { 'lat': position.coords.latitude, 'lng': position.coords.latitude, 'radius': position.coords.accuracy / 2 };
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
            this.jobMarkers = []; // tbd: clear markers after game completion
            this.playerJobsCollection.forEach((job, idx) => {
                console.log('planting marker for job ' + (idx + 1));
                marker = L.marker([job.lat, job.lng], { icon: this.markerIcon }).on('click', () => { this.onMarkerClick(job, idx) }).addTo(this.map);
                this.jobMarkers.push(marker);
            });
        }, 500);
    }

    showDeviceLocation(): void {
        console.log('showDeviceLocation');
        this.map.locate({ setView: true, watch: true });

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

    clearWaypointMarkers(): void {
        let markers = Array.from(this.mapElement.querySelector('.leaflet-marker-pane').querySelectorAll('.leaflet-marker-icon'));
        markers.splice(0, 3);
        markers.forEach((marker) => {
            marker.remove();
        });
    }

    onMarkerClick(job: any, collectionIdx: number): void {
        let content = this.createPopupContent(job, collectionIdx);
        L.popup()
            .setLatLng([job.lat, job.lng])
            .setContent(content).openOn(this.map);
    }

    async presentModal(job: any, collectionIdx: number) {
        console.log('presentModal', job)
        const modal = await this.modalCtrl.create({
            component: GameModalComponent,
            componentProps: {
                'job': job,
                'collectionId': collectionIdx,
                'subject': this.modalCommunicationSubject
            },
            cssClass: 'game-modal',
            animated: false,
        });

        modal.onDidDismiss().then(() => {
            console.log('modaldismiss', this.modalCommunicationSubject._value);
            console.log('job', job);
            console.log('player', this.player);
            let data = this.modalCommunicationSubject._value;
            if (data["game-started"] === true) {
                let player = this.player;
                let message, colour;
                if (data["game-won"] === true) {
                    // game win
                    message = 'Job completed. Cash: +£' + job["cash"] + ' / XP: +' + job["experience"] + '.';
                    colour = 'success';

                    player["cash"] = parseInt(player["cash"], 10) + job["cash"];
                    player["exp"] = parseInt(player["exp"], 10) + job["experience"];
                    player["jobs-completed"] = parseInt(player["jobs-completed"], 10) + 1;
                    // tbd: player progession (if p.exp + j.exp > threshold = p.level++) etc
                } else {
                    // game lose
                    message = 'Job failed. Better luck next time.';
                    colour = 'danger';
                    player["jobs-failed"] = parseInt(player["jobs-failed"], 10) + 1;
                }
                this.player = player;

                this.removeJobFromCollection(collectionIdx);
                this.markLocations();
                this.presentToast(message, 2000, colour);
            }
        });

        return await modal.present();
    }

    removeJobFromCollection(id) {
        console.log('removeJobFromCollection');
        this.playerJobsCollection.splice(id, 1);

        // tbd: remove markers

        this.save();
    }

    createPopupContent(job: any, collectionIdx: number): HTMLDivElement {
        const container = document.createElement('div'),
            titleText = document.createElement('p'),
            senderText = document.createElement('p'),
            rewardText = document.createElement('p'),
            gameText = document.createElement('p'),
            btnContainer = document.createElement('ion-buttons'),
            waypointBtn = document.createElement('ion-button'),
            playGameBtn = document.createElement('ion-button');

        titleText.textContent = 'Title: ' + job.name;
        senderText.textContent = 'Sent by: ' + job.sender;
        rewardText.textContent = 'Rewards: £' + job.cash + '  /  XP: ' + job.experience;
        gameText.textContent = 'Plug-in: ' + (job.game < 2 ? 'starfall.exe' : 'knightfall.exe');

        container.appendChild(titleText);
        container.appendChild(senderText);
        container.appendChild(rewardText);
        container.appendChild(gameText);

        waypointBtn.textContent = 'Waypoint';
        waypointBtn.onclick = () => {
            this.showWaypoint(job);
        }

        playGameBtn.textContent = 'Play';
        // playGameBtn.disabled = !this.jobs[jobId].inRange;
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

    onLocationError(event: L.ErrorEvent): void {
        console.error(event.type, event.message);
        setTimeout(() => {
            this.showDeviceLocation();
        }, 500);
    }

    onLocationFound(event: L.LocationEvent): void {
        console.log(event.type);
        // capture location
        this.userLocation = new L.LatLng(event.latlng.lat, event.latlng.lng);

        this.clearCircles();
        this.addCircle(event.latlng, event.accuracy / 2);


        this.checkRangeFromLocations();
    }

    checkRangeFromLocations(): void {
        console.log('checkRangeFromLocations');
        let jobLatLng: L.LatLng;
        this.playerJobsCollection.forEach((job, idx) => {
            jobLatLng = new L.LatLng(job.lat, job.lng);
            const distanceMeters = Math.round(this.userLocation.distanceTo(jobLatLng) * 1e2) / 1e2;
            console.log('distance to job ' + (idx + 1) + ': ' + distanceMeters + 'm');
            if (distanceMeters < 100) {
                console.log('in range of job ' + (idx + 1));
                job.inRange = true;
            } else {
                console.log('not in range of job ' + (idx + 1));
                job.inRange = false;
            }
        });
    }

    handleRoutingError(error: L.Routing.RoutingErrorEvent) {
        this.presentToast('Error finding route', 2000, 'danger');
        console.log(error.error.message);
        console.log('ERROR:', error)
    }

    createRouteControl(start: number[], end: number[]): L.Routing.Control {
        return new L.Routing.Control({
            // pointMarkerStyle: { 'className': 'hideMarker' },
            autoRoute: true,
            waypoints: [
                L.latLng(start[0], start[1]),
                L.latLng(end[0], end[1])
            ],
            routeWhileDragging: false,
            lineOptions: {
                styles: [{ color: 'purple', opacity: 1, weight: 5 }]
            }
        }).on('routesfound', (e) => {
            console.log('routesfound');
            // this.handleRoutingError(error);
        }).on('routingerror', (e) => {
            console.log('routingerror');
            this.handleRoutingError(e);
        }).addTo(this.map);
    }

    removeRouteControl(): void {
        this.map.removeControl(this.currentWaypoint.control);
        this.currentWaypoint = null;
    }

    addCircle(latlng: any, radius: number): void {
        this.circles.push(L.circle(latlng, radius).addTo(this.map));
    }

    removeCircle(circleId: number): void {
        if (this.circles[circleId] != undefined) {
            this.map.removeLayer(this.circles[circleId]);
        };
    }

    clearCircles(): void {
        this.circles = [];
    }

    destroy(): Promise<void> {
        console.log('destroy');
        return new Promise((resolve) => {
            this.map.remove();
            // clear property once removed - to stem outside destroy calls from parent components
            this.map = null;
            resolve();
        })
    }

    async ngOnDestroy() {
        console.log('ngOnDestroy');
        // calls to destroy map may be triggered before ngDestroy - check map first
        if (this.map) await this.destroy();
    }

    updateRecord() {
        let record = {
            id: this.saveData.currentUser["id"],
            user: this.saveData.currentUser["user"],
            pass: this.saveData.currentUser["pass"],
            cash: this.saveData.currentUser["cash"],
            web_cash: this.saveData.currentUser["web_cash"],
            exp: parseInt(this.saveData.currentUser["exp"], 10),
            level: parseInt(this.saveData.currentUser["level"], 10),
            completed: parseInt(this.saveData.currentUser["jobs-completed"], 10),
            failed: parseInt(this.saveData.currentUser["jobs-failed"], 10),
        }

        this._apiService.updateRecord(record).subscribe((record: Record) => {
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