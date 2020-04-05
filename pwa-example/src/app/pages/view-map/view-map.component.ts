import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
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
    player;

    constructor(private _location: Location, private _cdr: ChangeDetectorRef) {
        let saveData = JSON.parse(localStorage.getItem('saveData'));

        this.player = saveData.currentUser;
    }

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

    updateStats(event) {
        console.log('viewMap: updateStats', event);

        this.player = event.player;
        this._cdr.detectChanges();
    }

    goBack() {
        this.mapComponent.destroy().then(() => {
            this._location.back();
        });
    }
}