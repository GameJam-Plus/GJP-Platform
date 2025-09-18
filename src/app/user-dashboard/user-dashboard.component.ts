import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../types';
import { UserService } from '../services/user.service';
import { SiteService } from '../services/site.service';
import { RegionService } from '../services/region.service';
import { environment } from '../../environments/environment.prod';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent implements OnInit {
  myForm!: FormGroup;
  dataSource: User = {
    name: '',
    email: '',
    discordUsername: '',
    instagram: '',
    linkedin: '',
    telefoneWhatsApp: '',
    ethnicity: '',
    gender: '',
    intersex: '',
    identity: '',
    orientation: '',
    disability: '', 
    participation: '', 
    student: '',
    school: '',
    region: {
      _id: '',
      name: ''
    },
    site: {
      _id: '',
      name: ''
    },
    roles: [''],
    coins: 0
  };
  
  constructor(private fb: FormBuilder, private userService: UserService, private siteService: SiteService, private regionService: RegionService){}
  ngOnInit(): void {
    this.userService.getCurrentUser(`${environment.apiUrl}/api/user/get-user`).subscribe(
      user => {
        this.dataSource = user;
        this.myForm = this.fb.group({
          name: [user.name, Validators.required],
          email: [user.email, Validators.required],
          discordUsername: [user.discordUsername, Validators.required], 
          instagram: [user.instagram, Validators.required],
          linkedin: [user.linkedin, Validators.required],
          telefoneWhatsApp: [user.telefoneWhatsApp, Validators.required],
          ethnicity: [user.ethnicity, Validators.required],
          gender: [user.gender, Validators.required],
          intersex: [user.intersex, Validators.required],
          identity: [user.identity, Validators.required],
          orientation: [user.orientation, Validators.required],
          disability: [user.disability, Validators.required], 
          participation: [user.participation, Validators.required], 
          student: [user.student, Validators.required],
          school: [user.school, Validators.required],
        });
      },
      error => {
        console.error('Error al obtener usuarios:', error);
      }
    );
  }

  editar() {
    if (this.myForm.valid) {
      console.log('Formulario válido');
      const userId = this.dataSource._id;
      const { name, email, discordUsername, instagram, linkedin, telefoneWhatsApp, ethnicity, gender, intersex, identity, orientation, disability, participation, student, school } = this.myForm.value;
  
      this.userService.updateUser(`${environment.apiUrl}/api/user/update-user/${userId}`, {
        name: name,
        email: email,
        region: this.dataSource.region,
        site: this.dataSource.site,
        roles: this.dataSource.roles,
        coins: 0,
        discordUsername: discordUsername,
        instagram: instagram,
        linkedin: linkedin,
        telefoneWhatsApp: telefoneWhatsApp,
        ethnicity: ethnicity,
        gender: gender,
        intersex: intersex,
        identity: identity,
        orientation: orientation,
        disability: disability, 
        participation: participation, 
        student: student,         
        school: school, 
      }).subscribe({
        next: (data) => {
          if (data.success) {
            this.showSuccessMessage(data.msg);
          } else {
            this.showErrorMessage(data.error);
          }
        },
        error: (error) => {
          this.showErrorMessage(error.error.error);
        },
      });
    } else {
      console.log('Formulario inválido');
      this.showErrorMessage('Please fill in all fields of the form');
    }
  }

  successMessage: string = '';
  errorMessage: string = '';
  
  showSuccessMessage(message: string) {
    this.successMessage = message;
  }
  
  showErrorMessage(message: string) {
    this.errorMessage = message;
  }
}
