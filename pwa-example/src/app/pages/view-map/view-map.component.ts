import { Component, ViewChild, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { MapViewComponent } from 'src/app/components/map-view/map-view.component';

@Component({
    templateUrl: 'view-map.component.html',
    styleUrls: ['./view-map.component.scss']
})
export class ViewMapComponent implements OnDestroy {
    @ViewChild(MapViewComponent, { static: false }) mapComponent: MapViewComponent;
    // flag to show loading spinner
    loaded = false;
    player;
    animFrame;

    constructor(private _location: Location, private _cdr: ChangeDetectorRef) {
        let saveData = JSON.parse(localStorage.getItem('saveData'));

        this.player = saveData.currentUser;
    }

    ngAfterViewInit() {
        this.checkMap();
    }

    checkMap() {
        this.animFrame = requestAnimationFrame(() => {
            if (this.checkMapIsLoaded()) {
                requestAnimationFrame(() => {
                    this.loaded = true;
                });
            } else {
                this.checkMap();
            }
        });
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

    ngOnDestroy() {
        window.cancelAnimationFrame(this.animFrame);
    }
}