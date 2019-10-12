import { Component, OnInit } from '@angular/core';
// leaflet
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { Location } from '@angular/common';

declare var require: any;

@Component({
    templateUrl: 'map.component.html',
    styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
    map: L.Map;
    userLocation: any;
    routingControl: L.Routing.Control;
    circles: L.Circle[] = [];
    currentWaypoint: L.Routing.Control;

    jobs = [{ 'lat': 50.853703, 'lng': 0.572990 }, { 'lat': 50.8600, 'lng': 0.5830 }];

    constructor(private location: Location) { }

    goBack() {
        this.location.back();
    }

    ngOnInit() {
        // this.initializeMap();
    }

    ngAfterViewInit() {
        this.initializeMap();
    }

    initializeMap() {
        setTimeout(() => {
            console.log("initializing map");

            // init map instance with locationFound handler
            this.map = new L.Map('map');
            this.map.on('locationfound', (event) => {
                this.onLocationFound(event);
            }
            );

            // locate device
            this.map.locate({ setView: true, watch: true });

            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png32?access_token=pk.eyJ1IjoiZmlubmphY2stZ2IiLCJhIjoiY2sxbDNuYWttMDFqeDNkdGNmeGJidmxwZiJ9.0H8QEGBNpctFGH6XJv71dg', {
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                maxZoom: 15,
                id: 'mapbox.streets'
            }).addTo(this.map);
        }, 1000);
    }

    showJobPoints(event, jobId?: number) {
        if (this.currentWaypoint) {
            this.removeWaypoint();
        };
        if (jobId) {
            console.log('had id', event);
            this.addWaypoint([this.userLocation.lat, this.userLocation.lng], [this.jobs[jobId - 1].lat, this.jobs[jobId - 1].lng], event.target.textContent);
        } else {
            console.log('no id', event);
            const randomLatLng = this.getRandomLatLng(this.map);
            this.addWaypoint([this.userLocation.lat, this.userLocation.lng], [randomLatLng.lat, randomLatLng.lng], event.target.textContent);
        }
    }

    onLocationFound(event) {
        // capture location
        this.userLocation = { 'lat': event.latitude, 'lng': event.longitude };

        const radius = event.accuracy / 2;

        this.addCircle(event.latlng, radius);
    }

    addWaypoint(start: number[], end: number[], txt) {
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

    removeWaypoint() {
        this.map.removeControl(this.currentWaypoint);
        this.currentWaypoint = null;
    }

    addCircle(latlng: any, radius: number) {
        this.circles.push(L.circle(latlng, radius).addTo(this.map));
    }

    removeCircle(circleId) {
        if (this.circles[circleId] != undefined) {
            this.map.removeLayer(this.circles[circleId]);
        };
    }

    getRandomLatLng(map: L.Map) {
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