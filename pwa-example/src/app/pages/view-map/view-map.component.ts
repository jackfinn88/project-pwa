import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet-routing-machine';

@Component({
    templateUrl: 'view-map.component.html',
    styleUrls: ['./view-map.component.scss']
})
export class ViewMapComponent implements OnInit {
    mapElement: HTMLElement;
    map: L.Map;
    userLocation: any;
    routingControl: L.Routing.Control;
    circles: L.Circle[] = [];
    currentWaypoint: L.Routing.Control;

    locations: any;
    jobs = [{ 'lat': 50.853703, 'lng': 0.572990 }, { 'lat': 50.8600, 'lng': 0.5830 }];

    constructor(private _location: Location) { }

    goBack() {
        this._location.back();
    }

    ngOnInit() {
        //
    }

    ngAfterViewInit() {
        this.initializeMap();
        // this.test();
    }

    test() {
        const testObject = { 'one': 1, 'two': 2, 'three': 3 };

        // Put the object into storage
        localStorage.setItem('testObject', JSON.stringify(testObject));

        // Retrieve the object from storage
        const retrievedObject = localStorage.getItem('testObject');

        console.log('retrievedObject: ', JSON.parse(retrievedObject));
    }



    initializeMap() {
        console.log("initializeMap");

        // map instance
        this.map = new L.Map('map');

        this.map.on('locationfound', (event) => {
            console.log('location found');

            this.onLocationFound(event);
        }
        );

        // attribution
        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png32?access_token=pk.eyJ1IjoiZmlubmphY2stZ2IiLCJhIjoiY2sxbDNuYWttMDFqeDNkdGNmeGJidmxwZiJ9.0H8QEGBNpctFGH6XJv71dg', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 15,
            id: 'mapbox.streets'
        }).addTo(this.map);

        // locate device
        setTimeout(() => {
            this.locateDevice();
        }, 500);
    }

    locateDevice(): void {
        this.map.locate({ setView: true, watch: true });
    }

    showJobPoints(event, jobId?: number): void {
        if (this.currentWaypoint) {
            this.removeWaypoint();
        };
        const popupText = event.target.textContent;
        if (jobId) {
            this.addWaypoint([this.userLocation.lat, this.userLocation.lng], [this.jobs[jobId - 1].lat, this.jobs[jobId - 1].lng], popupText);
        } else {
            const randomLatLng = this.getRandomLatLng(this.map);
            this.addWaypoint([this.userLocation.lat, this.userLocation.lng], [randomLatLng.lat, randomLatLng.lng], popupText);
        }
    }

    onLocationFound(event): void {
        // capture location
        this.userLocation = { 'lat': event.latitude, 'lng': event.longitude, 'radius': event.accuracy / 2 };
        this.clearCircles();
        this.addCircle(event.latlng, this.userLocation.radius);
    }

    addWaypoint(start: number[], end: number[], txt): void {
        const routingControl = new L.Routing.Control({
            autoRoute: true,
            waypoints: [
                L.latLng(start[0], start[1]),
                L.latLng(end[0], end[1])
            ],
            routeWhileDragging: false,
        }).addTo(this.map);
        const latlng = new L.LatLng(end[0], end[1])
        L.popup()
            .setLatLng(latlng)
            .setContent(txt)
            .openOn(this.map);

        this.currentWaypoint = routingControl;
    }

    removeWaypoint(): void {
        this.map.removeControl(this.currentWaypoint);
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