import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { HomeComponent } from './pages/home/home.component';
import { ViewMapComponent } from './pages/view-map/view-map.component';
import { IonicModule } from '@ionic/angular';
import { MapViewComponent } from './components/map-view/map-view.component';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { HttpClientModule } from '@angular/common/http';
import { TransferComponent } from './pages/transfer/transfer.component';
import { JobsComponent } from './pages/jobs/jobs.component';
import { JobModalComponent } from './components/job-modal/job-modal.component';
import { JobsService } from './providers/job-service';
import { GameModalComponent } from './components/game-modal/game-modal.component';
import { FormsModule } from '@angular/forms';
import { AutocloseOverlaysService } from './providers/autoclose-service';

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        ViewMapComponent,
        MapViewComponent,
        TransferComponent,
        JobsComponent,
        JobModalComponent,
        GameModalComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        AppRoutingModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
        IonicModule.forRoot(),
        HttpClientModule
    ],
    entryComponents: [JobModalComponent, GameModalComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [JobsService, AutocloseOverlaysService, ScreenOrientation],
    bootstrap: [AppComponent]
})
export class AppModule { }
