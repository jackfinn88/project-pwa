import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    PHP_API_SERVER = 'https://jlf40.brighton.domains/ci301/app/api';

    constructor(private _httpClient: HttpClient) { }

    verifyUser(record: any): Observable<any> {
        return this._httpClient.post<any>(`${this.PHP_API_SERVER}/read.php`, record);
    }

    readRecords(record?: any): Observable<any[]> {
        return this._httpClient.post<any[]>(`${this.PHP_API_SERVER}/read.php`, record);
    }

    createRecord(record: any): Observable<any> {
        return this._httpClient.post<any>(`${this.PHP_API_SERVER}/create.php`, record);
    }

    updateRecord(record: any) {
        return this._httpClient.put<any>(`${this.PHP_API_SERVER}/update.php`, record);
    }

    deleteRecord(id: number) {
        return this._httpClient.delete<any>(`${this.PHP_API_SERVER}/delete.php/?id=${id}`);
    }
}
