import { Component, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { MapViewComponent } from 'src/app/components/map-view/map-view.component';

@Component({
    templateUrl: 'view-map.component.html',
    styleUrls: ['./view-map.component.scss']
})
export class ViewMapComponent {
    @ViewChild(MapViewComponent, { static: false }) mapComponent: MapViewComponent;

    constructor(private _location: Location) { }

    goBack() {
        this.mapComponent.destroy().then(() => {
            this._location.back();
        });
    }
}