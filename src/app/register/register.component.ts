import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { environment } from '../../environments/environment.prod';
import { MessagesComponent } from '../messages/messages.component';

export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other',
  PreferNotToSay = 'Prefer not to say'
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MessagesComponent
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errorMessage: string = '';
  genderOptions = Object.values(Gender);
  @ViewChild(MessagesComponent) message!: MessagesComponent;

  constructor(private router: Router, private fb: FormBuilder, private userService: UserService) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      discordUsername: ['', Validators.required],
      gender: ['', Validators.required],
      socialMedia: ['', Validators.required]
    });
  }

  submitForm() {
    if (this.registerForm.valid) {
      const { email, name, discordUsername, gender, socialMedia } = this.registerForm.value;

      this.userService.registerUser({
        name: name,
        email: email.toLowerCase().trim(),
        roles: ['Jammer'],
        coins: 0,
        discordUsername: discordUsername,
        gender: gender,
        socialMedia: socialMedia.trim()
      }).subscribe({
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
          console.log(error);
          this.errorMessage = error.error.message;
        },
      });
    } else {
      this.errorMessage = 'Please fill all the required fields';
    }
  }

  redirectToLogin() {
    this.router.navigate(['/login']);
  }
}
