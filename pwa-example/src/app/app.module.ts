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
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { DBComponent } from './pages/db/db.component';
import { JobsComponent } from './pages/jobs/jobs.component';
import { JobModalComponent } from './components/job-modal/job-modal.component';
import { JobsService } from './providers/job-service';
import { GameModalComponent } from './components/game-modal/game-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AutocloseOverlaysService } from './providers/autoclose-service';
import { RegistrationComponent } from './components/registration/registration.component';
import { LoginComponent } from './components/login/login.component';
import { TransferComponent } from './pages/transfer/transfer.component';
import { MyHttpInterceptor } from './providers/http-interceptor';
import { AccountComponent } from './pages/account/account.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { StatbarComponent } from './components/statbar/statbar.component';

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        ViewMapComponent,
        MapViewComponent,
        DBComponent,
        TransferComponent,
        JobsComponent,
        JobModalComponent,
        GameModalComponent,
        RegistrationComponent,
        LoginComponent,
        AccountComponent,
        InventoryComponent,
        StatbarComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        AppRoutingModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
        IonicModule.forRoot(),
        HttpClientModule
    ],
    entryComponents: [JobModalComponent, GameModalComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [JobsService, AutocloseOverlaysService, ScreenOrientation,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: MyHttpInterceptor,
            multi: true
        }],
    bootstrap: [AppComponent]
})
export class AppModule { }
