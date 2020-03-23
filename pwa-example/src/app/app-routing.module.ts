import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { ViewMapComponent } from './pages/view-map/view-map.component';
import { TransferComponent } from './pages/transfer/transfer.component';
import { JobsComponent } from './pages/jobs/jobs.component';

const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'home', component: HomeComponent },
    { path: 'map', component: ViewMapComponent },
    { path: 'transfer', component: TransferComponent },
    { path: 'jobs', component: JobsComponent },

    // otherwise redirect to home
    { path: '**', redirectTo: '' }];

@NgModule({
    imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
    exports: [RouterModule]
})
export class AppRoutingModule { }
