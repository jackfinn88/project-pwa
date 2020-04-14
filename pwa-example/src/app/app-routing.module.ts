import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { ViewMapComponent } from './pages/view-map/view-map.component';
import { JobsComponent } from './pages/jobs/jobs.component';
import { TransferComponent } from './pages/transfer/transfer.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { AccountComponent } from './pages/account/account.component';

const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'home', component: HomeComponent },
    { path: 'jobs', component: JobsComponent },
    { path: 'map', component: ViewMapComponent },
    { path: 'transfer', component: TransferComponent },
    { path: 'account', component: AccountComponent },
    { path: 'inventory', component: InventoryComponent },

    // otherwise redirect to home
    { path: '**', redirectTo: '' }];

@NgModule({
    imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
    exports: [RouterModule]
})
export class AppRoutingModule { }
