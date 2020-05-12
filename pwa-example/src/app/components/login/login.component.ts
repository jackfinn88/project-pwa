import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiService } from 'src/app/providers/api.service';

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
        });
    }

    onSubmit() {
        if (!this.loginForm.valid) {
            return;
        } else {
            let record = {
                user: this.loginForm.value.user,
                pass: this.loginForm.value.pass
            }

            this.apiService.verifyUser(record).subscribe((record) => {
                if (record) {
                    this.onVerify.emit(record);
                } else {
                    // not verified/try again
                    this.onVerify.emit(false);
                }
            });
        }
    }
}