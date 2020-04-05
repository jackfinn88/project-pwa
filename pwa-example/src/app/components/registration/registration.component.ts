import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiService } from 'src/app/providers/api.service';
import { Record } from 'src/app/util/record';

@Component({
    selector: 'app-registration',
    templateUrl: './registration.component.html',
    styleUrls: ['./registration.component.scss'],
})
export class RegistrationComponent implements OnInit {
    @Output() onCreate = new EventEmitter();
    registerForm: FormGroup;

    constructor(private apiService: ApiService) { }

    ngOnInit() {
        this.registerForm = new FormGroup({
            user: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(16)]),
            pass: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(16)])
        })
    }

    onSubmit() {
        console.log(this.registerForm);
        let record = {
            user: this.registerForm.value.user,
            pass: this.registerForm.value.pass,
            cash: 0,
            web_cash: 0,
            exp: 0,
            level: 0,
            completed: 0,
            failed: 0
        }
        // tbd: create
        this.apiService.createRecord(record).subscribe((record: Record) => {
            if (record) {
                console.log("Record created, ", record);

                this.onCreate.emit(record);
            }
        });
    }
}