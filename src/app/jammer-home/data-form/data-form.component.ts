import { Component, Input, Output, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { MessagesComponent } from '../../messages/messages.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators,  } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User, Site, Jam, Country, JammerData } from '../../../types';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-data-form',
  standalone: true,
  imports: [
    CommonModule,
    MessagesComponent,
    FormsModule,
    ReactiveFormsModule,
    TranslatePipe
  ],
  templateUrl: './data-form.component.html',
  styleUrl: './data-form.component.css'
})
export class DataFormComponent implements OnInit {
  @Input() user!: User;
  @Input() site!: Site;
  @Input() jam!: Jam;
  @Input() countries!: Country[];
  @ViewChild(MessagesComponent) message!: MessagesComponent;

  @Output() jammerData = new EventEmitter<boolean>();

  rulesLink = "/rules";
  jammerDataForm!: FormGroup;
  jammerDataFormValid: boolean = true;
  termsOfConduct: boolean = true;
  termsOfImage: boolean = true;
  termsOfIP: boolean = true;

  constructor(private fb: FormBuilder, private userService: UserService){}

  ngOnInit(): void {
    this.jammerDataForm = this.fb.group({
      name: [this.user.name, Validators.required],
      countryOfOrigin: ['', Validators.required],
      countryOfResidence: ['', Validators.required],
      city: ['', Validators.required],
      email: [this.user.email, Validators.required],
      discordUsername: [this.user.discordUsername, Validators.required],
      ethnicity: [this.user.ethnicity, Validators.required],
      gender: [this.user.gender, Validators.required],
      intersex: [this.user.intersex, Validators.required],
      student: [this.user.student, Validators.required],
      school: [this.user.student],
      degree: ['', Validators.required],

      // pronounH: false,
      // pronounS: false,
      // pronounT: false,
      // pronounO: false,

      identityAg: false,
      identityCM: false,
      identityCW: false,
      identityGF: false,
      identityQ: false,
      identityTM: false,
      identityTW: false,
      identityT: false,
      identityO: false,
      identityNo: false,

      orientationAs: false,
      orientationBi: false,
      orientationGay: false,
      orientationHet: false,
      orientationLes: false,
      orientationPan: false,
      orientationO: false,
      orientationNo: false,

      disabilityN: false,
      disabilityYI: false,
      disabilityYP: false,
      disabilityYV: false,
      disabilityYH: false,
      disabilityO: false,
      disabilityNo: false,

      industryFree: false,
      industryStudio: false,
      industryOwn: false,
      industryNone: false,
      industryPast: false,
      industryNo: false,

      studyNone: false,
      studyFree: false,
      studyTechnical: false,
      studyDegree: false,
      studyPostgraduate: false,
      studyProgramming: false,
      studyDesign: false,
      studyArts: false,
      studyMusic: false,
      studyNarrative: false,
      studyBiz: false,
      studyOther: false,

      participation: [this.user.participation, Validators.required],

      termsOfConduct: ['', Validators.required],
      termsOfImage: ['', Validators.required],
      termsOfIP: ['', Validators.required]
    });
  }

  isLanguageDefault()
  {
    return this.site.language != 'PT' && this.site.language != 'ES';
  }

  saveJammerData()
  {
    if(this.user && this.jam && this.site)
    {
      if(this.jammerDataForm.valid)
      {
        //let pronouns = new Array();
        // if(this.jammerDataForm.get('pronounH')?.value) pronouns.push('He/Him');
        // if(this.jammerDataForm.get('pronounS')?.value) pronouns.push('She/Her');
        // if(this.jammerDataForm.get('pronounT')?.value) pronouns.push('They/Them');
        // if(this.jammerDataForm.get('pronounO')?.value) pronouns.push('Other');

        let identity = new Array();
        if(this.jammerDataForm.get('identityAg')?.value) identity.push('Agender');
        if(this.jammerDataForm.get('identityCM')?.value) identity.push('Cisgender Man');
        if(this.jammerDataForm.get('identityCW')?.value) identity.push('Cisgender Woman');
        if(this.jammerDataForm.get('identityGF')?.value) identity.push('Gender Fluid');
        if(this.jammerDataForm.get('identityQ')?.value) identity.push('Queer');
        if(this.jammerDataForm.get('identityTM')?.value) identity.push('Transgender Man');
        if(this.jammerDataForm.get('identityTW')?.value) identity.push('Transgender Woman');
        if(this.jammerDataForm.get('identityT')?.value) identity.push('Travesti');
        if(this.jammerDataForm.get('identityO')?.value) identity.push('Other');
        if(this.jammerDataForm.get('identityNo')?.value) identity.push('Prefer not to declare');
        
        let orientation = new Array();
        if(this.jammerDataForm.get('orientationAs')?.value) orientation.push('Asexual');
        if(this.jammerDataForm.get('orientationBi')?.value) orientation.push('Bisexual');
        if(this.jammerDataForm.get('orientationGay')?.value) orientation.push('Gay');
        if(this.jammerDataForm.get('orientationHet')?.value) orientation.push('Heterosexual');
        if(this.jammerDataForm.get('orientationLes')?.value) orientation.push('Lesbian');
        if(this.jammerDataForm.get('orientationPan')?.value) orientation.push('Pansexual');
        if(this.jammerDataForm.get('orientationO')?.value) orientation.push('Other');
        if(this.jammerDataForm.get('orientationNo')?.value) orientation.push('Prefer not to declare');

        let disability = new Array();
        if(this.jammerDataForm.get('disabilityN')?.value) disability.push('No');
        if(this.jammerDataForm.get('disabilityYI')?.value) disability.push('Intellectual disability');
        if(this.jammerDataForm.get('disabilityYP')?.value) disability.push('Physical disability');
        if(this.jammerDataForm.get('disabilityYV')?.value) disability.push('Visual disability');
        if(this.jammerDataForm.get('disabilityYH')?.value) disability.push('Hearing disability');
        if(this.jammerDataForm.get('disabilityO')?.value) disability.push('Other');
        if(this.jammerDataForm.get('disabilityNo')?.value) disability.push('Prefer not to declare');

        let studies = new Array();
        if(this.jammerDataForm.get('studyNone')?.value) studies.push('No studies related to games industry');
        if(this.jammerDataForm.get('studyFree')?.value) studies.push('Free courses or self taught');
        if(this.jammerDataForm.get('studyTechnical')?.value) studies.push('Technical degree in game development');
        if(this.jammerDataForm.get('studyDegree')?.value) studies.push('Academic degree in game development');
        if(this.jammerDataForm.get('studyPostgraduate')?.value) studies.push('Postgraduate degree in game development');
        if(this.jammerDataForm.get('studyProgramming')?.value) studies.push('Programming/Computer Science');
        if(this.jammerDataForm.get('studyDesign')?.value) studies.push('Design');
        if(this.jammerDataForm.get('studyArts')?.value) studies.push('Fine Arts');
        if(this.jammerDataForm.get('studyMusic')?.value) studies.push('Music/Sound');
        if(this.jammerDataForm.get('studyNarrative')?.value) studies.push('Narrative/Communication/Letters');
        if(this.jammerDataForm.get('studyBiz')?.value) studies.push('Business/Management');
        if(this.jammerDataForm.get('studyOther')?.value) studies.push('Other related with Game Development');

        let industry = new Array();
        if(this.jammerDataForm.get('industryFree')?.value) industry.push('I work in the games industry as a freelancer');
        if(this.jammerDataForm.get('industryStudio')?.value) industry.push('I work in the games industry in a studio');
        if(this.jammerDataForm.get('industryOwn')?.value) industry.push('I own a game studio');
        if(this.jammerDataForm.get('industryNone')?.value) industry.push("I haven't worked in the games industry yet, but I'm looking forward to it");
        if(this.jammerDataForm.get('industryPast')?.value) industry.push("I used to work in the games industry, but I don't anymore");
        if(this.jammerDataForm.get('industryNo')?.value) industry.push("I'm not interested in working in the games industry, I jam for fun");

        if(this.termsOfConduct && this.termsOfImage && this.termsOfIP)
        {
          let jammerData : JammerData = {
            name: this.jammerDataForm.get('name')?.value,
            email: this.jammerDataForm.get('email')?.value,
            discordUsername: this.jammerDataForm.get('discordUsername')?.value,
            countryOfOrigin: this.jammerDataForm.get('countryOfOrigin')?.value.name,
            countryOfResidence: this.jammerDataForm.get('countryOfResidence')?.value.name,
            city: this.jammerDataForm.get('city')?.value,
            ethnicity: this.jammerDataForm.get('ethnicity')?.value,
            //pronouns: pronouns,
            gender: this.jammerDataForm.get('gender')?.value,
            intersex: this.jammerDataForm.get('intersex')?.value,
            identity: identity,
            orientation: orientation,
            disability: disability,
            student: this.jammerDataForm.get('student')?.value,
            school: this.jammerDataForm.get('school')?.value,
            degree: this.jammerDataForm.get('degree')?.value,
            studies: studies,
            industry: industry,
            participation: this.jammerDataForm.get('participation')?.value,
            termsOfConduct: this.jammerDataForm.get('termsOfConduct')?.value,
            termsOfImage: this.jammerDataForm.get('termsOfImage')?.value,
            termsOfIP: this.jammerDataForm.get('termsOfIP')?.value
          };

          this.userService.saveJammerData(this.user!._id!, this.site!._id!, this.jam!._id!, jammerData).subscribe({
            next: (data)=>{
              console.log(data);
              this.jammerData.emit(true);
            },
            error: (error)=>{
              this.message.showMessage("Error", error.error.message);
            }
          });
        }

      }
      else
      {
        this.jammerDataFormValid = false;
      }
    }
  }
}
