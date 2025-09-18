import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { environment } from '../../environments/environment.prod';
import { MessagesComponent } from '../messages/messages.component';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatTooltipModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errorMessage: string = '';
  //genderOptions = Object.values(Gender);
  @ViewChild(MessagesComponent) message!: MessagesComponent;

  constructor(private router: Router, private fb: FormBuilder, private userService: UserService) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      discordUsername: ['', Validators.required],
      instagram: ['',Validators.required],
      linkedin: [''],
      telefoneWhatsApp: [''],
      ethnicity: ['', Validators.required],
      gender: ['', Validators.required],
      intersex: ['', Validators.required],
      genderIdentity: ['', Validators.required],
      sexualOrientation: ['', Validators.required],
      disability: ['', Validators.required], 
      participation: ['', Validators.required],
      student: ['', Validators.required],           
      nameStuding: ['', Validators.required], 
    });
    //testa se a pergunta "você estuda?" tem como resposta "Yes", fazendo com que possa escrever o nome da escola
    this.registerForm.get('student')!.valueChanges.subscribe((value) => {
        const nameStudingControl = this.registerForm.get('nameStuding');

        if(value == 'Yes'){
          nameStudingControl!.enable();
          nameStudingControl!.setValidators([Validators.required]);
        } else {
          nameStudingControl!.setValue('');
          nameStudingControl!.clearValidators();
          nameStudingControl!.disable();
        }
        nameStudingControl!.updateValueAndValidity();
      }); 
  }

  submitForm() {
    if (this.registerForm.valid) {
      const { email, name, region, site, discordUsername, instagram, linkedin, telefoneWhatsApp, diploma, ethnicity, gender, intersex, genderIdentity, sexualOrientation, disability, participation, student, nameStuding} = this.registerForm.value;
      this.userService.registerUser({
        name: name,
        email: email.toLowerCase().trim(),
        roles: ['Jammer'],
        coins: 0,
        discordUsername: discordUsername,
        instagram: instagram,
        linkedin: linkedin,
        telefoneWhatsApp: telefoneWhatsApp,
        //diploma: diploma,
        ethnicity: ethnicity,
        gender: gender,
        intersex: intersex,
        genderIdentity: genderIdentity,
        sexualOrientation: sexualOrientation,
        disability: disability, //se tem alguma deficiencia
        participation: participation, //se ja participou de GJ+ anteriores
        student: student,         //se é estudante ou não
        nameStuding: nameStuding, //nome local que estuda
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
