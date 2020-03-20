import { Injectable } from '@angular/core';
import * as data from "../../assets/json/jobs.json";

@Injectable({
    providedIn: 'root',
})
export class JobsService {
    constructor() { }

    getData() {
        return data.default;
    }
}