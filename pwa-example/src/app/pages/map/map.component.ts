import { Component, OnInit } from '@angular/core';
// leaflet
import * as L from 'leaflet';

declare var require: any;

@Component({
    templateUrl: 'map.component.html',
    styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
    constructor() { }

    ngOnInit() {
        this.initializeMap();
    }

    initializeMap() {
        setTimeout(() => {
            console.log("initializing map");

            var map = L.map('map').setView([50.8543, 0.5735], 13);

            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png32?access_token=pk.eyJ1IjoiZmlubmphY2stZ2IiLCJhIjoiY2sxbDNuYWttMDFqeDNkdGNmeGJidmxwZiJ9.0H8QEGBNpctFGH6XJv71dg', {
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                maxZoom: 13,
                id: 'mapbox.streets'
            }).addTo(map);

            /*L.marker([51.5, -0.09]).addTo(map)
              .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
              .openPopup();*/
        }, 1000);
    }
}