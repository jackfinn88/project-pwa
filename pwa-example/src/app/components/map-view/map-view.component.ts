import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { Router } from '@angular/router';

@Component({
	selector: 'app-map-view',
	templateUrl: './map-view.component.html',
	styleUrls: ['./map-view.component.scss']
})
export class MapViewComponent implements OnInit {
	@ViewChild('map', { read: ElementRef, static: false }) mapElementRef: ElementRef;

	isFirstLoad: boolean = true;

	mapElement: HTMLElement;
	map: L.Map;
	userLocation: L.LatLng;
	routingControl: L.Routing.Control;
	circles: L.Circle[] = [];
	currentWaypoint: IWaypoint;
	jobMarkers: L.Marker[] = [];

	locations: any[] = [{ 'lat': 50.853703, 'lng': 0.572990 }, { 'lat': 50.8600, 'lng': 0.5830 }];
	jobs: IJob[] = [
		{ 'id': '1', 'title': 'Job 1', 'description': 'Go here to XXXX', 'lat': 50.853703, 'lng': 0.572990, 'inRange': false },
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

	constructor(private _router: Router) { }

	ngOnInit() {
		//
		this.getLocation();
	}

	ngAfterViewInit() {
		// this.getLocation();

		// this.initializeMap();

		// this.testLocalStorage();
	}

	testLocalStorage(): void {
		const testObject = { 'one': 1, 'two': 2, 'three': 3 };

		// Put the object into storage
		localStorage.setItem('testObject', JSON.stringify(testObject));

		// Retrieve the object from storage
		const retrievedObject = localStorage.getItem('testObject');

		console.log('retrievedObject: ', JSON.parse(retrievedObject));
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
			minZoom: 14,
			zoomControl: false
		}
		// map instance
		this.map = new L.Map('map', options);

		this.map.on('locationerror', (event) => {
			this.onLocationError(event);
		})

		this.map.on('locationfound', (event) => {
			this.onLocationFound(event);
		}
		);

		// attribution
		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png32?access_token=pk.eyJ1IjoiZmlubmphY2stZ2IiLCJhIjoiY2sxbDNuYWttMDFqeDNkdGNmeGJidmxwZiJ9.0H8QEGBNpctFGH6XJv71dg', {
			attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			maxZoom: 15,
			id: 'mapbox.streets'
		}).addTo(this.map);

		setTimeout(() => {
			this.showDeviceLocation();
			this.mapElement = this.mapElementRef.nativeElement;
		}, 1000);

	}

	markLocations(): void {
		console.log('markLocations');
		setTimeout(() => {
			const randLatLng = this.getRandomLatLng(this.map);
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
			this.jobs.forEach((job, idx) => {
				console.log('planting marker for job ' + (idx + 1));
				marker = L.marker([job.lat, job.lng], { icon: this.markerIcon }).on('click', (e) => { this.onMarkerClick(e, idx) }).addTo(this.map);
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
			const random = this.getRandomLatLng(this.map);
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

	onMarkerClick(event: L.LeafletEvent, jobId: number): void {
		const content = this.createPopupContent(jobId);
		L.popup()
			.setLatLng([this.jobs[jobId].lat, this.jobs[jobId].lng])
			.setContent(content).openOn(this.map);
	}

	onPlayBtnClick(event: MouseEvent, jobId: number): void {
		console.log('Open game for Job ' + (jobId + 1));
		this.destroy().then(() => {
			this._router.navigateByUrl('/game');
		})
	}

	createPopupContent(jobId: number): HTMLDivElement {
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
		playGameBtn.disabled = !this.jobs[jobId].inRange;
		playGameBtn.onclick = (e) => {
			this.onPlayBtnClick(e, jobId);
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
		}).on('routesfound', (error) => {
			this.handleRoutingError(error);
		}).on('routingerror', (error) => {
			this.handleRoutingError(error);
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

	getRandomLatLng(map: L.Map): L.LatLng {
		console.log('getRandomLatLng');
		const bounds = map.getBounds(),
			southWest = bounds.getSouthWest(),
			northEast = bounds.getNorthEast(),
			lngSpan = northEast.lng - southWest.lng,
			latSpan = northEast.lat - southWest.lat;

		console.log(bounds);

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