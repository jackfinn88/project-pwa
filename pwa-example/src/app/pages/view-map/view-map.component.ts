import { Component, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { MapViewComponent } from 'src/app/components/map-view/map-view.component';

@Component({
    templateUrl: 'view-map.component.html',
    styleUrls: ['./view-map.component.scss']
})
export class ViewMapComponent {
    @ViewChild(MapViewComponent, { static: false }) mapComponent: MapViewComponent;
    // flag to show loading spinner
    loaded = false;

    constructor(private _location: Location) { }

    ngAfterViewInit() {
        this.checkMap();
    }

    checkMap() {
        requestAnimationFrame(() => {
            if (this.checkMapIsLoaded()) {
                this.loaded = true;
            } else {
                this.checkMap();
            }
        })
    }

    // check map component is ready
    checkMapIsLoaded(): boolean {
        return this.mapComponent && this.mapComponent.loaded;
    }

    goBack() {
        this.mapComponent.destroy().then(() => {
            this._location.back();
        });
    }
}