import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class LocationsService {

    constructor(private httpService: HttpClient) { }

    getMovies() {
        return this.httpService.get('../../assets/locations.json');
    }

}