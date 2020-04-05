import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Record } from '../util/record';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    PHP_API_SERVER = 'https://jlf40.brighton.domains/dump/angular/test/api';

    constructor(private _httpClient: HttpClient) { }

    verifyUser(record: Record): Observable<Record> {
        return this._httpClient.post<Record>(`${this.PHP_API_SERVER}/api/read.php`, record);
    }

    readRecords(record?: Record): Observable<Record[]> {
        return this._httpClient.post<Record[]>(`${this.PHP_API_SERVER}/api/read.php`, record);
    }

    createRecord(record: Record): Observable<Record> {
        return this._httpClient.post<Record>(`${this.PHP_API_SERVER}/api/create.php`, record);
    }

    updateRecord(record: Record) {
        return this._httpClient.put<Record>(`${this.PHP_API_SERVER}/api/update.php`, record);
    }

    deleteRecord(id: number) {
        return this._httpClient.delete<Record>(`${this.PHP_API_SERVER}/api/delete.php/?id=${id}`);
    }
}
