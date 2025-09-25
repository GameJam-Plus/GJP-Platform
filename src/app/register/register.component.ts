import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../types';
import { UserService } from '../services/user.service';
import { environment } from '../../environments/environment.prod';
import { MessagesComponent } from '../messages/messages.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

/*export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Nonbinary = 'Non-binary',
  PreferNotToDeclare = 'Prefer not to declare'
}*/

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MessagesComponent,
    MatTooltipModule,
    TranslatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    TooltipModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errorMessage: string = '';
  //genderOptions = Object.values(Gender);
  @ViewChild(MessagesComponent) message!: MessagesComponent;

  constructor(private router: Router, private fb: FormBuilder, private userService: UserService, private translate: TranslateService) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      discordUsername: ['', Validators.required],
      instagram: [''],
      linkedin: [''],
      telefoneWhatsApp: [''],
      ethnicity: ['', Validators.required],
      gender: ['', Validators.required],
      intersex: ['', Validators.required],
      identity: ['', Validators.required],
      orientation: ['', Validators.required],
      disability: ['', Validators.required], 
      participation: ['', Validators.required],
      student: ['', Validators.required],           
      school: ['', Validators.required], 
    });
    //testa se a pergunta "você estuda?" tem como resposta "Yes", fazendo com que possa escrever o nome da escola
    this.registerForm.get('student')!.valueChanges.subscribe((value) => {
        const schoolControl = this.registerForm.get('school');

        if(value == 'Yes'){
          schoolControl!.enable();
          schoolControl!.setValidators([Validators.required]);
        } else {
          schoolControl!.setValue('');
          schoolControl!.clearValidators();
          schoolControl!.disable();
        }
        schoolControl!.updateValueAndValidity();
      }); 
  }

  submitForm() {
    if (!this.registerForm.valid) {
      const controls = this.registerForm.controls;
        for (const name in controls) {
            if (controls[name].invalid) {
              console.log(`Invalid field: ${name}`);
              console.log(`Value: ${controls[name].value}`);
              console.log(`Errors:`, controls[name].errors);
            }
        }
        this.errorMessage = this.translate.instant('platform.errors.requiredfields');
    }
    else
    {
      const formValues = this.registerForm.value;

      const user: User = {
        name: formValues.name,
        email: formValues.email,
        roles: ['Jammer'],
        coins: 0,
        discordUsername: formValues.discordUsername,
        instagram: formValues.instagram,
        linkedin: formValues.linkedin,
        telefoneWhatsApp: formValues.telefoneWhatsApp,
        ethnicity: formValues.ethnicity,
        gender: formValues.gender,
        intersex: formValues.intersex,
        identity: formValues.identity,
        orientation: formValues.orientation,
        disability: formValues.disability,
        participation: formValues.participation,
        student: formValues.student,
        school: formValues.school,
      }

      this.userService.registerUser(user).subscribe({
        next: (data) => {
          if (data.success) {
            this.message.showMessage(
              "Registration Successful",
              "You have registered successfully, we'll redirect you to the login page",
              () => {
                this.redirectToLogin();
              }
            )
          } else {
            this.errorMessage = 'Something went wrong';
          }
        },
        error: (error) => {
          this.errorMessage = error.error.message;
        }
      });
    }
  }

  redirectToLogin() {
    this.router.navigate(['/login']);
  }
}
