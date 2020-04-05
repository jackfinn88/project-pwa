import { Component, HostListener } from '@angular/core';
import { AutocloseOverlaysService } from './providers/autoclose-service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    @HostListener('window:popstate', ['$event'])
    onPopState() {
        // use autoclose service to close any modal/popover/menu/actionsheet
        this.autocloseService.trigger();
    }
    autocloseService: AutocloseOverlaysService;

    constructor(autocloseOverlayService: AutocloseOverlaysService) {
        this.autocloseService = autocloseOverlayService;
    }


}


