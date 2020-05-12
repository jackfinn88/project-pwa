import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiService } from 'src/app/providers/api.service';

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
            pass: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(16)]),
            confirm: new FormControl('', [Validators.compose([Validators.required, this.validateAreEqual.bind(this)])])
        });
    }

    validateAreEqual(fieldControl: FormControl) {
        if (this.registerForm) {
            return fieldControl.value === this.registerForm.get("pass").value ? null : {
                NotEqual: true
            };
        }
    }

    onSubmit() {
        if (!this.registerForm.valid) {
            return;
        } else {
            let record = {
                user: this.registerForm.value.user,
                pass: this.registerForm.value.pass,
                ph_cash: 0,
                ph_exp: 0,
                ph_total_exp: 0,
                ph_level: 1,
                ph_completed: 0,
                ph_failed: 0,
                ph_game01_upgrade01_level: 0,
                ph_game01_upgrade02_level: 0,
                ph_game02_upgrade01_level: 0,
                ph_game02_upgrade02_level: 0,
                ph_game01_upgrade01_active: false,
                ph_game01_upgrade02_active: false,
                ph_game02_upgrade01_active: false,
                ph_game02_upgrade02_active: false,
                ph_game01_dual: false,
                ph_game02_dual: false,
                lto_equipped: 'pistol',
                lto_cash: 500,
                lto_exp: 0,
                lto_total_exp: 0,
                lto_player_level: 1,
                lto_player_next_level: 2000,
                lto_game_level: 1,
                lto_sfx: 5,
                lto_music: 5,
                lto_difficulty: 2
            }

            this.apiService.createRecord(record).subscribe((record) => {
                if (record) {
                    this.onCreate.emit(record);
                }
            });
        }
    }
}