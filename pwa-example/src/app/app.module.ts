import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { GameComponent } from './pages/view-game/view-game.component';
import { HomeComponent } from './pages/home/home.component';
import { ViewMapComponent } from './pages/view-map/view-map.component';
import { IonicModule } from '@ionic/angular';
import { MapViewComponent } from './components/map-view/map-view.component';
import {ScreenOrientation} from '@ionic-native/screen-orientation/ngx';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GameComponent,
    ViewMapComponent,
    MapViewComponent,
    GameComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    IonicModule.forRoot(),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [ScreenOrientation],
  bootstrap: [AppComponent]
})
export class AppModule { }
