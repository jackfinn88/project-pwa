import { Component, OnInit, ViewChild, ElementRef, Input, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { Router } from '@angular/router';
import { ToastController, ModalController } from '@ionic/angular';
import { GameModalComponent } from '../game-modal/game-modal.component';
import { Subscription, fromEvent } from 'rxjs';

@Component({
    selector: 'app-map-view',
    templateUrl: './map-view.component.html',
    styleUrls: ['./map-view.component.scss']
})
export class MapViewComponent implements OnInit, OnDestroy {
    @Input('interactive') isInteractive: boolean;

    @ViewChild('map', { read: ElementRef, static: false }) mapElementRef: ElementRef;
    accessToken = 'pk.eyJ1IjoiZmlubmphY2stZ2IiLCJhIjoiY2s3bmowbTJoMGUyajNsbTc5Y3ZhemtqNCJ9.qaNK4anI5YokbSKxUXpNWQ'; // openstreetmaps - tbd - remove

    isFirstLoad: boolean = true;

    mapElement: HTMLElement;
    map: L.Map;
    userLocation: L.LatLng;
    routingControl: L.Routing.Control;
    circles: L.Circle[] = [];
    currentWaypoint: IWaypoint;
    jobMarkers: L.Marker[] = [];
    loaded: boolean = false;
    playerData;
    playerJobsCollection;

    locations: any[] = [{ 'lat': 50.853703, 'lng': 0.572990 }, { 'lat': 50.8600, 'lng': 0.5830 }];
    jobs: IJob[] = [
        { 'id': '1', 'title': 'Job 1', 'description': 'Go here to XXXX', 'lat': 50.8515, 'lng': 0.5839, 'inRange': false },
        { 'id': '2', 'title': 'Job 2', 'description': 'Go here to XXXX', 'lat': 50.8600, 'lng': 0.5830, 'inRange': false }
    ];
    markerIcon = L.icon({
        iconUrl: 'assets/icons/custom/map-marker.png',
        shadowUrl: 'assets/icons/custom/map-marker-shadow.png',

        iconSize: [38, 56], // size of the icon
        shadowSize: [42, 34], // size of the shadow
        iconAnchor: [20, 56], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 34],  // the same for the shadow
    });
    private backbuttonSubscription: Subscription;
    constructor(public modalCtrl: ModalController, public toastController: ToastController, private _router: Router) { }

    ngOnInit() {
        this.getLocation();
        console.log(this.isInteractive);
        this.getPlayerData();

        //

        const event = fromEvent(document, 'backbutton');
        this.backbuttonSubscription = event.subscribe(async () => {
            console.log('backbutton');
            const modal = await this.modalCtrl.getTop();
            if (modal) {
                console.log('close modal');
                modal.dismiss();
            }
        });
    }

    getPlayerData() {
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


    // store current data regarding available jobs
    savePlayerData() {
        console.log('savePlayerData');
        this.playerData['active-jobs'] = this.playerJobsCollection;

        localStorage.setItem('player', JSON.stringify(this.playerData));
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
                this.userLocation = new L.LatLng(position.coords.latitude, position.coords.latitude);
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
        // attribution
        /*L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png32?access_token=' + this.accessToken, {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 15,
            id: 'mapbox.streets'
        }).addTo(this.map);*/

        if (this.isInteractive) {
            console.log("interactive", this.isInteractive);
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

        }

        setTimeout(() => {
            this.showDeviceLocation();
            this.mapElement = this.mapElementRef.nativeElement;
            this.loaded = true;
            console.log('loaded', this.loaded)
        }, 1000);

    }

    markLocations(): void {
        console.log('markLocations');
        setTimeout(() => {
            const randLatLng = this.getRandomLatLng();
            const randJob: IJob = {
                'id': '3',
                'title': 'Job 3',
                'description': 'Go here to XXXX',
                'lat': randLatLng.lat,
                'lng': randLatLng.lng,
                'inRange': false
            };
            this.jobs.push(randJob);

            let marker: L.Marker;
            this.jobMarkers = []; // tbd
            /*this.jobs.forEach((job, idx) => {
                console.log('planting marker for job ' + (idx + 1));
                marker = L.marker([job.lat, job.lng], { icon: this.markerIcon }).on('click', (e) => { this.onMarkerClick(e, idx, job) }).addTo(this.map);
                this.jobMarkers.push(marker);
            });*/
            this.playerJobsCollection.forEach((job, idx) => {
                console.log('planting marker for job ' + (idx + 1));
                marker = L.marker([job.lat, job.lng], { icon: this.markerIcon }).on('click', (e) => { this.onMarkerClick(e, idx, job) }).addTo(this.map);
                this.jobMarkers.push(marker);
            });
        }, 500);
    }

    showDeviceLocation(): void {
        console.log('showDeviceLocation');
        this.map.locate({ setView: true, watch: true });
    }

    showWaypoint(jobId?: number): void {
        if (this.currentWaypoint) {
            this.currentWaypoint.popup.closePopup();
            this.removeRouteControl();
        };

        let latLng: any;
        if (jobId >= 0) {
            latLng = [this.jobs[jobId].lat, this.jobs[jobId].lng];
        } else {
            const random = this.getRandomLatLng();
            latLng = [random.lat, random.lng];
        };
        const popupContent = jobId >= 0 ? this.jobs[jobId].title + '<br>' + this.jobs[jobId].description : 'Random Job' + '<br>' + 'Go here to XXXX';
        const popup = L.popup()
            .setLatLng(latLng)
            .setContent(popupContent);

        this.currentWaypoint = {
            id: '1',
            control: this.createRouteControl([this.userLocation.lat, this.userLocation.lng], latLng),
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

    onMarkerClick(event: L.LeafletEvent, jobId: number, job: any): void {
        const content = this.createPopupContent(jobId, job);
        /*L.popup()
            .setLatLng([this.jobs[jobId].lat, this.jobs[jobId].lng])
            .setContent(content).openOn(this.map);*/
        L.popup()
            .setLatLng([job.lat, job.lng])
            .setContent(content).openOn(this.map);
    }

    async presentModal(gameId: number, job: any) {
        console.log('presentModal', gameId)
        const modal = await this.modalCtrl.create({
            component: GameModalComponent,
            componentProps: {
                'job': job
            },
            cssClass: 'game-modal',
            animated: false,
        });
        return await modal.present();
    }

    onPlayBtnClick(event: MouseEvent, jobId: number, job: any) {
        // id is added to srcElement from ngFor, cast type to collect
        const id = (event as any).srcElement.id;
        this.presentModal(jobId, job);
    }

    createPopupContent(jobId: number, job: any): HTMLDivElement {
        const container = document.createElement('div'),
            waypointBtn = document.createElement('ion-button'),
            playGameBtn = document.createElement('ion-button');
        waypointBtn.setAttribute('size', 'small');
        waypointBtn.textContent = 'Waypoint';
        waypointBtn.onclick = () => {
            this.showWaypoint(jobId);
        }

        playGameBtn.setAttribute('size', 'small');
        playGameBtn.textContent = 'Play';
        // playGameBtn.disabled = !this.jobs[jobId].inRange;
        playGameBtn.onclick = (e) => {
            this.onPlayBtnClick(e, jobId, job);
        }

        container.classList.add('popup-container');
        container.innerHTML = this.jobs[jobId].title + '<br>' + this.jobs[jobId].description + '<br>';
        container.appendChild(waypointBtn);
        container.appendChild(playGameBtn);

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
        if (this.isFirstLoad) {
            this.markLocations();
            this.isFirstLoad = false;
        }
        // capture location
        this.userLocation = new L.LatLng(event.latlng.lat, event.latlng.lng);

        this.clearCircles();
        this.addCircle(event.latlng, event.accuracy / 2);


        this.checkRangeFromLocations();
    }

    checkRangeFromLocations(): void {
        console.log('checkRangeFromLocations');
        let jobLatLng: L.LatLng;
        this.jobs.forEach((job, idx) => {
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

    getRandomLatLng(): L.LatLng {
        console.log('getRandomLatLng');
        const bounds = this.map.getBounds(),
            southWest = bounds.getSouthWest(),
            northEast = bounds.getNorthEast(),
            lngSpan = northEast.lng - southWest.lng,
            latSpan = northEast.lat - southWest.lat;

        return new L.LatLng(
            southWest.lat + latSpan * Math.random(),
            southWest.lng + lngSpan * Math.random());
    }

    destroy(): Promise<void> {
        console.log('destroy');
        return new Promise((resolve) => {
            this.map.remove();
            resolve();
        })
    }

    ngOnDestroy() {

        console.log('ngOnDestroy');
        this.backbuttonSubscription.unsubscribe();
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