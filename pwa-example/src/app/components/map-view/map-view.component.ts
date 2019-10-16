import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';

@Component({
	selector: 'app-map-view',
	templateUrl: './map-view.component.html',
	styleUrls: ['./map-view.component.scss']
})
export class MapViewComponent implements OnInit {
	@ViewChild('map', { read: ElementRef, static: false }) mapElementRef: ElementRef;

	mapElement: HTMLElement;
	map: L.Map;
	userLocation: any;
	routingControl: L.Routing.Control;
	circles: L.Circle[] = [];
	currentWaypoint: IWaypoint;

	locations: any[] = [{ 'lat': 50.853703, 'lng': 0.572990 }, { 'lat': 50.8600, 'lng': 0.5830 }];
	jobs: IJob[] = [
		{ 'id': '1', 'title': 'Job 1', 'description': 'Go here to XXXX', 'lat': 50.853703, 'lng': 0.572990 },
		{ 'id': '2', 'title': 'Job 2', 'description': 'Go here to XXXX', 'lat': 50.8600, 'lng': 0.5830 }
	];

	constructor() { }

	ngOnInit() {
		//
	}

	ngAfterViewInit() {
		this.getLocation();

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
				this.userLocation = { 'lat': position.coords.latitude, 'lng': position.coords.latitude, 'radius': position.coords.accuracy / 2 };
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
			minZoom: 15,
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
			console.log(this.mapElement);
			this.markLocations();
		}, 1000);

	}

	markLocations(): void {
		setTimeout(() => {
			const randLatLng = this.getRandomLatLng(this.map);
			const randJob: IJob = {
				'id': '3',
				'title': 'Job 3',
				'description': 'Go here to XXXX',
				'lat': randLatLng.lat,
				'lng': randLatLng.lng
			};
			this.jobs.push(randJob);

			this.jobs.forEach((job, idx) => {
				L.marker([job.lat, job.lng]).on('click', (e) => { this.onMarkerClick(e, idx) }).addTo(this.map);
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
			this.removeWaypoint();
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

	createPopupContent(jobId: number): HTMLDivElement {
		const container = document.createElement('div'), btn = document.createElement('ion-button');
		btn.onclick = () => {
			this.showWaypoint(jobId);
		}
		btn.setAttribute('size', 'small');
		btn.textContent = 'Waypoint';
		container.classList.add('popup-container');
		container.innerHTML = this.jobs[jobId].title + '<br>' + this.jobs[jobId].description + '<br>';
		container.appendChild(btn);

		return container;
	}

	onLocationError(event: L.ErrorEvent): void {
		console.log(event.type, event.message);
		setTimeout(() => {
			this.showDeviceLocation();
		}, 500);
	}

	onLocationFound(event: L.LocationEvent): void {
		console.log(event.type);
		// capture location
		this.userLocation = { 'lat': event.latlng.lat, 'lng': event.latlng.lng, 'radius': event.accuracy / 2 };
		this.clearCircles();
		this.addCircle(event.latlng, this.userLocation.radius);
	}

	handleRoutingError(error: L.Routing.RoutingErrorEvent) {
		console.log(error.error.message);
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
		}).on('routingerror', (error) => {
			this.handleRoutingError(error)
		}).addTo(this.map);
	}

	removeWaypoint(): void {
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
		const bounds = map.getBounds(),
			southWest = bounds.getSouthWest(),
			northEast = bounds.getNorthEast(),
			lngSpan = northEast.lng - southWest.lng,
			latSpan = northEast.lat - southWest.lat;

		return new L.LatLng(
			southWest.lat + latSpan * Math.random(),
			southWest.lng + lngSpan * Math.random());
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
}