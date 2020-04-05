import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiService } from 'src/app/providers/api.service';
import { Record } from 'src/app/util/record';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
    @Output() onVerify = new EventEmitter();
    loginForm;

    constructor(private apiService: ApiService) { }

    ngOnInit() {
        this.loginForm = new FormGroup({
            user: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(16)]),
            pass: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(16)])
        })
    }

    onSubmit() {
        if (!this.loginForm.valid) {
            console.log('not valid', this.loginForm);
            return;
        } else {
            console.log('valid', this.loginForm);
            let record = {
                user: this.loginForm.value.user,
                pass: this.loginForm.value.pass,
                cash: 0,
                web_cash: 0,
                exp: 0,
                level: 0,
                completed: 0,
                failed: 0
            }
            this.apiService.verifyUser(record).subscribe((record: Record) => {
                if (record) {
                    console.log("User verified: ", record);

                    this.onVerify.emit(record);
                } else {
                    console.log("User not verified");
                    // tbd: not verified/try again
                    this.onVerify.emit(false);
                }
            });
        }
    }
}