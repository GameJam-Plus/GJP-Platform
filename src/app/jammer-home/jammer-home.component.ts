import { Component, OnInit, Input, ViewChild, ViewChildren, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators  } from '@angular/forms';
import { CommonModule, formatDate } from '@angular/common';
import { TeamService } from '../services/team.service';
import { UserService } from '../services/user.service';
import { SiteService } from '../services/site.service';
import { RegionService } from '../services/region.service';
import { JamService } from '../services/jam.service';
import { SubmissionService } from '../services/submission.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.prod';
import { MessagesComponent } from '../messages/messages.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataFormComponent } from './data-form/data-form.component';
import { RulesComponent } from '../rules/rules.component';
import { User, Site, Region, Country, Jam, Stage, Team, Submission, JamStage } from '../../types';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { faSitemap } from '@fortawesome/free-solid-svg-icons';
import { faPalette } from '@fortawesome/free-solid-svg-icons';
import { faFilePowerpoint } from '@fortawesome/free-solid-svg-icons';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faShareNodes } from '@fortawesome/free-solid-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { faLandmark } from '@fortawesome/free-solid-svg-icons';
import { faPeopleRoof } from '@fortawesome/free-solid-svg-icons';
import { faJar } from '@fortawesome/free-solid-svg-icons';
import { Console } from 'node:console';
import { now } from 'moment';

// Grace period in milliseconds (default: 48 hours)
const SUBMISSION_GRACE_PERIOD_MS = 48 * 60 * 60 * 1000;

@Component({
    selector: 'app-jammer-home',
    standalone: true,
    templateUrl: './jammer-home.component.html',
    styleUrls: ['./jammer-home.component.css'],
    imports: [
        CommonModule,
        MessagesComponent,
        FontAwesomeModule,
        MatTooltipModule,
        FormsModule,
        ReactiveFormsModule,
        RulesComponent,
        DataFormComponent
    ]
})
export class JammerHomeComponent implements OnInit, OnDestroy {
  @Input() user!: User;
  @ViewChild(MessagesComponent) message!: MessagesComponent;
  @ViewChild('selectGenre') set selectGenre(content: ElementRef) {
    if(content) {
      for(let o = 0; o < content.nativeElement.length; ++o)
      {
        if(this.gameGenres.includes(content.nativeElement[o].value))
          content.nativeElement[o].selected = true;
      }
    }
  }
  @ViewChild('selectTopic') set selectTopic(content: ElementRef) {
    if(content) {
      for(let o = 0; o < content.nativeElement.length; ++o)
      {
        if(this.gameTopics.includes(content.nativeElement[o].value))
          content.nativeElement[o].selected = true;
      }
    }
  }
  @ViewChild('selectThemes') set selectTheme(content: ElementRef) {
    if(content) {
      for(let o = 0; o < content.nativeElement.length; ++o)
      {
        if(this.gameThemes.includes(content.nativeElement[o].value))
          content.nativeElement[o].selected = true;
      }
    }
  }
  @ViewChild('selectCategories') set selectCategory(content: ElementRef) {
    if(content) {
      for(let o = 0; o < content.nativeElement.length; ++o)
      {
        if(this.gameCategories.includes(content.nativeElement[o].value))
          content.nativeElement[o].selected = true;
      }
    }
  }
  @ViewChild('selectPlatforms') set selectPlatorm(content: ElementRef) {
    if(content) {
      for(let o = 0; o < content.nativeElement.length; ++o)
      {
        if(this.gamePlatforms.includes(content.nativeElement[o].value))
          content.nativeElement[o].selected = true;
      }
    }
  }
  @ViewChild('selectAccelerationPlatforms') set selectAccelerationPlatform(content: ElementRef) {
    if(content) {
      for(let o = 0; o < content.nativeElement.length; ++o)
      {
        if(this.submissionAccelerationForm.get('accelerationPlatforms')?.value?.includes(content.nativeElement[o].value))
          content.nativeElement[o].selected = true;
      }
    }
  }
  regions: Region[] = [];
  sites: Site[] = [];
  countries: Country[] = [];
  staff: User[] = [];
  jammers: User[] = [];
  selectedRegion?: Region;
  filteredSites: Site[] = [];
  deltaTime: string = '00:00:00:00';
  timeZone: string = '';
  page: string = "site";
  intervalId: any;

  site?: Site;
  jam?: Jam;
  team?: Team;
  submission?: Submission;
  siteSubmissions: any[] = [];
  jammerData: boolean = false;
  jamData: any = {};

  submissionGamejamForm!: FormGroup;
  submissionPitchGamejamForm!: FormGroup;
  submissionIncubationForm!: FormGroup;
  submissionPitchIncubationForm!: FormGroup;
  submissionAccelerationForm!: FormGroup;
  submissionPitchAccelerationForm!: FormGroup;

  gameGenres: string[] = [];
  gameTopics: string[] = [];
  gameThemes: string[] = [];
  gameCategories: string[] = [];
  gamePlatforms: string[] = [];

  faCoffee = faCoffee;
  faCircleInfo = faCircleInfo;
  faSitemap = faSitemap;
  faPalette = faPalette;
  faFilePowerpoint = faFilePowerpoint;
  faUsers = faUsers;
  faUser = faUser;
  faDiscord = faDiscord;
  faEnvelope = faEnvelope;
  faLocationDot = faLocationDot;
  faLandmark = faLandmark;
  faPeopleRoof = faPeopleRoof;
  faInstagram = faInstagram;
  faWhatsapp = faWhatsapp;
  faShareNodes = faShareNodes;
  faJar = faJar;

  randomAdjectives = [
    "quick", "happy", "bright", "calm", "gentle", "smooth", "kind", "warm", "polite", "cheerful",
    "brave", "intelligent", "strong", "friendly", "generous", "honest", "creative", "thoughtful", "graceful", "charming",
    "reliable", "wise", "caring", "loyal", "patient", "elegant", "fair", "witty", "resourceful", "inspiring",
    "adventurous", "curious", "playful", "bold", "confident", "diligent", "respectful", "determined", "helpful", "motivated",
    "optimistic", "energetic", "supportive", "passionate", "ambitious", "artistic", "sincere", "trustworthy", "humble", "organized"
  ];

  randomColors = [
    "red", "blue", "green", "yellow", "purple", "orange", "pink", "brown", "black", "white"
  ];

  randomPluralNouns = [
      "apples", "bananas", "cars", "dogs", "elephants", "fishes", "guitars", "houses", "islands", "jackets",
      "kangaroos", "lions", "mountains", "notebooks", "oranges", "pencils", "queens", "rabbits", "suns", "tigers",
      "umbrellas", "vases", "whales", "xylophones", "yachts", "zebras", "balloons", "cakes", "desks", "engines",
      "flowers", "globes", "hats", "ices", "juices", "kites", "lamps", "moons", "nests", "oceans",
      "pianos", "quilts", "roses", "stars", "trees", "violins", "windows", "yogurts", "zoos", "bridges"
  ];

  readonly JamStages = JamStage;

  constructor(private fb: FormBuilder, private router: Router, private teamService: TeamService, private userService: UserService, private siteService: SiteService, private regionService: RegionService, private jamService: JamService, private submissionService: SubmissionService) {}

  ngOnInit(): void
  {
    // TODO: Get the new forms values
    this.submissionGamejamForm = this.fb.group({
      title: ['', Validators.required],
      contact: ['', Validators.required],
      link: ['', Validators.required],
      description: ['', Validators.required],
      graphics: ['', Validators.required],
      engine: ['', Validators.required],
      goingToIncubation: [false, Validators.required],
      recommendation: '',
      enjoyment: '',
      suggestions: '',
      authorization: ['', Validators.required]
    });

    this.submissionPitchGamejamForm = this.fb.group({
      link: ['', Validators.required],
      acceleration: false
    });

    this.submissionIncubationForm = this.fb.group({
      title: ['', Validators.required],
      contact: ['', Validators.required],
      link: ['', Validators.required],
      description: ['', Validators.required],
      graphics: ['', Validators.required],
      engine: ['', Validators.required],
      goingToIncubation: [false, Validators.required],
      recommendation: '',
      enjoyment: '',
      suggestions: '',
      authorization: ['', Validators.required]
    });

    this.submissionPitchIncubationForm = this.fb.group({
      incubationPitch: ['', Validators.required]
    });

    this.submissionAccelerationForm = this.fb.group({
      accelerationBuildLink: ['', Validators.required],
      accelerationPitchVideo: ['', Validators.required],
      accelerationGameplayVideo: ['', Validators.required],
      accelerationSoundtrack: [''],
      accelerationPlatforms: [[], Validators.required],
      recommendationAcceleration: '',
      enjoymentAcceleration: ''
    });

    this.submissionPitchAccelerationForm = this.fb.group({
      accelerationPitch: ['', Validators.required]
    });

    let tzOffset = 180; // 3 hours * 60 minutes - BRT
    this.timeZone = tzOffset > 0 ? `+${tzOffset}` : `${tzOffset}`;

    this.listCountries();
    this.getJamOfUser();

    this.intervalId = setInterval(() => {
      this.getDeltaTime();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  listCountries(): void
  {
    this.siteService.getCountries(`http://${environment.apiUrl}:3000/api/site/get-countries`).subscribe({
      next: (countries) => {
        this.countries = countries;
      },
      error: (error) => {
        console.error('Error getting countries:', error);
      }
    });
  }

  getJamOfUser() : void
  {
    this.jamService.getJamByUser(this.user._id!).subscribe({
      next: (data) => {
        console.log(data.jammerData);
        if(data.jammerData) this.jammerData = true;
        this.jam = data.jam;
        this.site = data.site;
        this.team = data.team;
        this.listStaff();
        this.listJammers();
        this.countJamData();
        this.getSubmission();

        console.log(this.team);
      },
      error: (error) => {
        //if(error.status === 404)
        this.listRegions();
        this.listSites();
      }
    });
  }

  countJamData(): void{
    if(this.jam)
    {
      this.jamService.countJamData(this.jam._id!).subscribe({
        next: (data) => {
          this.jamData = data;
        },
        error: (error) => {
          console.log(error);
        }
      });
    }
  }

  getSubmissionsOfSite()
  {
    if(this.site?._id && this.jam?._id)
    {
      this.submissionService.getSubmissionsBySite(this.site._id, this.jam._id).subscribe({
        next: (data) => {
          this.siteSubmissions = data;
        },
        error: (error) => {
          this.message.showMessage("Error", error.error.message);
        }
      });
    }
  }

  getTeam() : void
  {
    if(this.site && this.jam)
    {
      const url = `http://${environment.apiUrl}:3000/api/team/get-team/${this.user._id}/${this.site._id}/${this.jam._id}`;
      this.teamService.getTeam(url).subscribe({
        next: (team: Team) => {
          this.team = team;
          this.getSubmission();
        },
        error: (error) => {
          console.log(error);
        }
      });
    }
  }

  getSubmission() : void
  {
    if(this.site && this.jam && this.team)
    {
      console.log('Fetching submission for team:', this.team._id);
      this.submissionService.getSubmissionByTeam(this.team._id!).subscribe({
        next: (submission: Submission) => {
          this.submission = submission;
          this.patchSubmissionForm(submission);
        },
        error: (error) => {
          console.log('No submission found for this team.');
          console.log(error);
        }
      });
    }
  }

  createTeam() : void
  {
    if(this.site && this.jam && this.user)
    {
      const url = `http://${environment.apiUrl}:3000/api/team/create-team`;
      const teamName = `${this.randomAdjectives[this.getRandomInt(0,50)]} ${this.randomColors[this.getRandomInt(0,10)]} ${this.randomPluralNouns[this.getRandomInt(0,50)]}`;
      const team: Team = {
        teamName: teamName,
        jamId: this.jam._id!,
        siteId: this.site._id!,
        jammers: [{
          _id: this.user._id!,
          name: this.user.name,
          email: this.user.email,
          discordUsername: this.user.discordUsername,
          role: 'owner'
        }]
      };
      this.teamService.createTeam(url, team).subscribe({
        next: (team: Team) => {
          console.log(team);
          this.team = team;
        },
        error: (error) => {
          console.log(error);
        }
      });
    }
  }

  getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  joinTeam(): void
  {
    this.message.showQuestion(
      "Join a Team",
      "Enter the team's secret code",
      (code: string) => {
        const url = `http://${environment.apiUrl}:3000/api/team/join-jammer/${code}/${this.user._id}`;
        this.teamService.addJammerToTeam(url).subscribe({
          next: (team: Team) => {
            this.team = team;
          },
          error: (error) => {
            console.log(error.error.message);
          }
        });
      }
    );
  }

  saveTeam()
  {
    if(this.site && this.jam && this.team)
    {
      console.log(this.team.teamName);
      const url = `http://${environment.apiUrl}:3000/api/team/update-team/${this.team._id}`;
      this.teamService.updateTeam(url, this.team).subscribe({
        next: (data)=>{
          this.message.showMessage("Success", data.message);
        },
        error: (error)=>{
          this.message.showMessage("Error", error.error.message);
        }
      });
    }
  }

  listStaff() : void
  {
    const url = `http://${environment.apiUrl}:3000/api/user/get-site-staff/${this.site!._id}`;
    this.userService.getStaffPerSite(url).subscribe({
      next: (staff: User[]) => {
        this.staff = staff;
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  listJammers() : void
  {

  }

  listRegions() : void
  {
    const url = `http://${environment.apiUrl}:3000/api/region/get-regions`;
    this.regionService.getRegions(url).subscribe({
      next: (regions: Region[]) => {
        this.regions = regions;
        this.selectedRegion = regions[0];
      },
      error: (error) => {
        console.error('Error loading regions:', error);
      }
    });
  }

  listSites() : void
  {
    const url = `http://${environment.apiUrl}:3000/api/site/get-sites-per-jam/open`;
    this.siteService.getSitesPerJam(url).subscribe({
      next: (sites: Site[]) => {
        this.sites = sites;
      },
      error: (error) => {
        console.error('Error loading sites:', error);
      }
    });
  }

  selectRegion(region: Region) : void
  {
    this.selectedRegion = region;
    this.filteredSites = this.sites.filter((site) => site.regionId == region._id);
  }

  // Creates a link between this jammer the site and the jam
  // Relation user-site is not permanent for Jammer, only for LocalOrganizer
  joinSite(site: Site)
  {
    this.message.showDialog(
      "Confirm Action",
      `Join site ${site.name}?`,
      () => {
        const url = `http://${environment.apiUrl}:3000/api/site/join-site`;
        this.siteService.joinSite(url, {
          userId: this.user._id,
          siteId: site._id
        }).subscribe({
          next: (data) => {
            this.site = data.site;
            this.jam = data.jam;
            this.listStaff();
          },
          error: (error) => {
            console.log(error);
          }
        });
      }
    );
  }

  exitSite() : void
  {
    if(this.site && this.jam && this.user)
    {
      this.message.showQuestion(
        "Confirm Action",
        `Are you sure you want to exit site ${this.site.name}?<br>Write the name of the site in the field below to confirm.`,
        (answer: string) => {
          if(this.site && this.jam && answer === this.site.name)
          {
            const url = `http://${environment.apiUrl}:3000/api/site/exit-site`;
            this.siteService.exitSite(url, {
              userId: this.user._id,
              siteId: this.site._id,
              jamId: this.jam._id
            }).subscribe({
              next: (data) => {
                console.log(data);
                this.message.showMessage(
                  "Success",
                  data.message,
                  ()=>{
                    window.location.reload();
                  }
                );
              },
              error: (error) => {
                console.log(error);
              }
            });
          }
        },
        () => {}
      );
    }
  }

  exitTeam()
  {
    if(this.team)
    {
      this.message.showQuestion(
        "Confirm Action",
        `Are you sure you want to exit team ${this.team.teamName}?<br>Write the name of the team in the field below to confirm.`,
        (answer: string) => {
          if(this.team && answer === this.team.teamName)
          {
            const url = `http://${environment.apiUrl}:3000/api/team/remove-jammer/${this.team._id}/${this.user._id}`;
            this.teamService.removeJammerFromTeam(url).subscribe({
              next: (data) => {
                console.log(data);
                this.message.showMessage(
                  "Success",
                  data.message,
                  ()=>{
                    this.team = undefined;
                  }
                );
              },
              error: (error) => {
                this.message.showMessage(
                  'Error',
                  error.error.message
                );
                console.log(error);
              }
            });
          }
        },
        () => {}
      );
    }
  }

  setJammerData(jammerData: boolean)
  {
    this.jammerData = jammerData;
  }

  getDeltaTime() : void
  {
    if(this.jam)
    {
      let endDate = new Date();
      let now = new Date();
      this.jam.stages.forEach(stage => {
        if(this.isCurrentStage(stage))
        {
          endDate = new Date(stage.endDate);
        }
      });

      const delta = endDate.getTime() - now.getTime();
      const days = Math.floor(delta / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
      const hours = Math.floor((delta % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
      const minutes = Math.floor((delta % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const seconds = Math.floor((delta % (1000 * 60)) / 1000).toString().padStart(2, '0');

      this.deltaTime = `${days}d : ${hours}h : ${minutes}m : ${seconds}s`;
    }
  }

  /**
   * Receives a date in text format from the database with the time reference of BRT
   * Converts it to Date format with the local timezone
   * Removes the local timezone
   * Removes the offset of the brazilian timezone
   * Prints the normalized date for the UI
   * @param date Date in text format from the database
   * @returns
   */
  formatDate(date: Date){
    // Receives a date in text format from the database
    date = new Date(date);

    let now = new Date();
    let tzOffset = (now.getTimezoneOffset() - 180) * 60000;

    // Remove the BRT offset
    date = new Date(date.getTime() + tzOffset);

    return formatDate(date, 'yyyy-MM-dd', 'en');
  }

  convertTo12h(time24h: string) : string {
    // Split the time into hours and minutes
    let [hour, minute] = time24h.split(':').map(Number);

    // Determine the period (AM/PM)
    let period = hour < 12 ? 'AM' : 'PM';

    // Convert hour to 12-hour format
    hour = hour % 12 || 12; // Convert '0' to '12'

    // Return the formatted time in 12-hour format
    return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
  }

  generateWhatsAppLink(phoneNumber: string) : string
  {
    // Clean the phone number by removing non-numeric characters
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "");

    // Base WhatsApp URL
    const baseURL = "https://wa.me/";

    // Generate the full WhatsApp link
    const whatsappLink = `${baseURL}${cleanedPhoneNumber}`;

    return whatsappLink;
  }

  formatURL(url: string)
  {
    if(!url.includes('http')) url = 'http://' + url;
    return url;
  }

  isCurrentStage(stage: any) : boolean{
    let startDate = new Date(stage.startDate).getTime();
    let endDate = new Date(stage.endDate).getTime();
    let now = new Date().getTime();
    return (startDate < now && now < endDate);
  }

  getCurrentStage()
  {
    if(this.jam)
    {
      let currentStage: any = null;
      this.jam.stages.forEach(stage => {
        if(this.isCurrentStage(stage)) currentStage = stage;
      })
      return currentStage;
    }
    return null;
  }

  getJamStage() : typeof JamStage {
    return JamStage;
  }

  getStageClass(stage: any)
  {
    if(this.isCurrentStage(stage))
    {
      return 'card inverted border border-dark';
    }
    else
    {
      return 'card';
    }
  }

  onTimeForSubmission()
  {
    // for now we rather don't close the form and track late entries
    return true;

    /*
    if(this.site && this.jam)
    {
      // If this site has a customSubmissionTime ignore the stage submission and use that instead
      if(this.site.customSubmissionTime)
      {
        let endDate = new Date(this.site.customSubmissionTime);
        let now = new Date();
        let delta = endDate.getTime() - now.getTime();
        return delta > 0;
      }

      // if this site doesn't have a custom submission form, find the current stage of the jam
      let currentStage: any = null;
      let now = new Date().getTime();

      for(let s = 0; s < this.jam.stages.length; ++s)
      {
        let startDate = this.offsetDate(this.jam.stages[s].startDate).getTime();
        let endDate = this.offsetDate(this.jam.stages[s].endDate).getTime();
        if(startDate <= now && now <= endDate)
        {
          currentStage = this.jam.stages[s];
          break;
        }
      }

      if(currentStage)
      {
        const jammerRole = currentStage?.roles.find((role: any) => role.roleName == 'Jammer');

        if(currentStage && jammerRole)
        {
          let endDate = this.offsetDate(currentStage.endDate);
          let now = new Date();
          let delta = endDate.getTime() - now.getTime();
          return delta > 0;
        }
      }
    }
    return false;
    */
  }

  getTimeZoneOffset()
  {
    return (new Date()).getTimezoneOffset();
  }

  /**
   * Gets the time delta from the local time to the first edition endTime
   * NOTE: this function only works for a stage with stageName == "GameJam"
   * @returns
   */
  getRelativeTimeDelta()
  {
    if(this.jam && this.site && this.team)
    {
      /*
      if(this.site.customSubmissionTime)
      {
        let endDate = new Date(this.site.customSubmissionTime);
        let now = new Date();
        let delta = endDate.getTime() - now.getTime();
        return delta;
      }
      */

      let now = new Date();
      let offset = now.getTimezoneOffset() * 60000;
      now = new Date((now.getTime() - offset));
      let currentStage: any = null;

      for(let s = 0; s < this.jam.stages.length; ++s)
      {
        if(this.jam.stages[s].stageName == JamStage.GAMEJAM)
        {
          let endDate = new Date(this.jam.stages[s].endDate);
          endDate = new Date(endDate.getTime() - (180 * 60000));

          return endDate.getTime() - now.getTime();
        }
      }
    }
    return 0;
  }

  getRelativePitchDelta()
  {
    if(this.jam && this.site && this.team)
    {
      if(this.site.customSubmissionTime)
      {
        let endDate = new Date(this.site.customSubmissionTime);
        endDate = new Date((endDate.getTime() + 48*60*60*1000));
        let now = new Date();
        let delta = endDate.getTime() - now.getTime();
        return delta;
      }

      let now = new Date();
      let offset = now.getTimezoneOffset() * 60000;
      now = new Date((now.getTime() - offset));
      let currentStage: any = null;

      for(let s = 0; s < this.jam.stages.length; ++s)
      {
        if(this.jam.stages[s].stageName == JamStage.PITCH_SUBMISSION)
        {
          let endDate = new Date(this.jam.stages[s].endDate);
          //endDate = new Date(endDate.getTime() - (180 * 60000) + (48*60*60*1000));
          endDate = new Date(endDate.getTime() - (180 * 60000));

          return endDate.getTime() - now.getTime();
        }
      }
    }
    return 0;
  }

  getAccelerationTimeDelta() {
    if(this.jam && this.site && this.team) {
      let now = new Date();
      let offset = now.getTimezoneOffset() * 60000;
      now = new Date((now.getTime() - offset));
      
      // Look for Acceleration Submission stage
      for(let s = 0; s < this.jam.stages.length; ++s) {
        if(this.jam.stages[s].stageName == JamStage.ACCELERATION_SUBMISSION) {
          let endDate = new Date(this.jam.stages[s].endDate);
          // Adjust for Brazilian timezone (GMT-3)
          endDate = new Date(endDate.getTime() - (180 * 60000));
          
          return endDate.getTime() - now.getTime();
        }
      }
    }
    return 0;
  }

  getStageTimeDelta(stage: JamStage) {
    if (this.jam && this.site && this.team) {
      let now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      now = new Date(now.getTime() - offset); // Convert to UTC
  
      const targetStage = this.jam.stages.find((s: any) => s.stageName === stage);
      if (targetStage && targetStage.endDate) {
        let endDate = new Date(targetStage.endDate);
        endDate = new Date(endDate.getTime() - (180 * 60000));
        return endDate.getTime() - now.getTime();
      }
    }
  
    return 0;
  }

  formatTimeDelta(delta: number)
  {
    delta = Math.abs(delta);
    const days = Math.floor(delta / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
    const hours = Math.floor((delta % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutes = Math.floor((delta % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const seconds = Math.floor((delta % (1000 * 60)) / 1000).toString().padStart(2, '0');

    return `${days}d : ${hours}h : ${minutes}m : ${seconds}s`;
  }

  // TODO: Not used. Check to delete
  getSubmissionDelta()
  {
    if(this.jam)
    {
      let currentStage: any = null;
      let now = new Date().getTime();
      let startDate = 0;
      let endDate = 0;
      for(let s = 0; s < this.jam.stages.length; ++s)
      {
        startDate = this.offsetDate(this.jam.stages[s].startDate).getTime();
        endDate = this.offsetDate(this.jam.stages[s].endDate).getTime();
        if(startDate <= now && now <= endDate)
        {
          currentStage = this.jam.stages[s];
          break;
        }
      }

      if(currentStage)
      {
        let delta = endDate - now;
        return this.formatTimeDelta(delta);
      }
    }
    return '';
  }

  getDeadline()
  {
    let currentStage = this.getCurrentStage();
    let deadline = new Date(currentStage.endDate);
    if(this.site?.customSubmissionTime) deadline = new Date(this.site.customSubmissionTime);
    return formatDate(deadline, 'yyyy-MM-dd HH:mm', 'en');
  }

  /**
   * Offsets the enddate of a stage by three hours to match the latest timezone
   * @param date input date in UTC format from the database in BRT timezone
   */
  offsetDate(dateStr: any)
  {
    let date = new Date(dateStr);

    // BRT is GMT-3, offset by 3 hours to match GMT-6
    // 3h * 60m * 60s * 1000ms
    let millis = date.getTime() + 10800000;
    return new Date(millis);
  }

  setGameGenre(value: any)
  {
    let genres = new Array();
    for(var g = 0; g < value.length; ++g)
    {
      genres.push(value[g].value);
    }
    this.gameGenres = genres;
  }

  setGameTopics(value: any)
  {
    let topics = new Array();
    for(var t = 0; t < value.length; ++t)
    {
      topics.push(value[t].value);
    }
    this.gameTopics = topics;
  }

  setGameThemes(value: any)
  {
    let topics = new Array();
    for(var t = 0; t < value.length; ++t)
    {
      topics.push(value[t].value);
    }
    this.gameThemes = topics;
  }

  setGameCategories(value: any)
  {
    let categories = new Array();
    for(var c = 0; c < value.length; ++c)
    {
      categories.push(value[c].value);
    }
    this.gameCategories = categories;
  }

  setGamePlatforms(value: any)
  {
    let platforms = new Array();
    for(var p = 0; p < value.length; ++p)
    {
      platforms.push(value[p].value);
    }
    this.gamePlatforms = platforms;
  }

  setAccelerationPlatforms(value: any) {
    let platforms = new Array();
    for(var p = 0; p < value.length; ++p) {
      platforms.push(value[p].value);
    }
    console.log('Setting platforms:', platforms);
    this.submissionAccelerationForm.patchValue({ accelerationPlatforms: platforms });
  }

  // Setting the forms default values when opening the page
  patchSubmissionForm(submission: Submission): void {
    if(this.jam && this.site && this.team)
    {
      let contact = -1;
      for(let i = 0; i < this.team.jammers.length; ++i)
      {
        console.log('team.jammers[i]:', this.team.jammers[i]);
        console.log('submission.gamejamContact:', submission.gamejamContact);
        if(this.team.jammers[i]._id == submission.gamejamContact._id) contact = i
      }

      this.gameGenres = submission.gamejamGenres;
      this.gameTopics = submission.gamejamTopics;
      this.gameThemes = submission.gamejamThemes;
      this.gameCategories = submission.gamejamCategories;
      this.gamePlatforms = submission.gamejamPlatforms;

      this.submissionGamejamForm.setValue({
        title: submission.gamejamTitle,
        link: submission.gamejamBuild,
        contact: contact,
        description: submission.gamejamDescription,
        graphics: submission.gamejamGraphics,
        engine: submission.gamejamEngine,
        goingToIncubation: submission.goingToIncubation,
        recommendation: submission.gamejamRecommendation,
        enjoyment: submission.gamejamEnjoyment,
        suggestions: submission.gamejamSuggestions,
        authorization: submission.gamejamAuthorization ? 'Yes' : 'No'
      });

      this.submissionPitchGamejamForm.setValue({
        link: submission.gamejamPitch? submission.gamejamPitch : '',
        acceleration: submission.goingToAcceleration? submission.goingToAcceleration: false
      });
      
      // Patch acceleration form if acceleration data exists
      if (submission.accelerationBuild) {
        console.log('Loading existing acceleration data:', submission);
        this.submissionAccelerationForm.patchValue({
          accelerationBuildLink: submission.accelerationBuild,
          accelerationPitchVideo: submission.accelerationPitch,
          accelerationGameplayVideo: submission.accelerationGameplayVideo,
          accelerationSoundtrack: submission.accelerationSoundtrack,
          accelerationPlatforms: submission.accelerationPlatforms,
          recommendationAcceleration: submission.accelerationRecommendation,
          enjoymentAcceleration: submission.accelerationEnjoyment
        });
      }

      console.log(submission);
    }
  }

  // TODO: Add new functions for each form
  // TODO: Handle the submission based on new variables in the schema
  saveSubmission()
  {
    if(this.site && this.jam && this.team)
    {
      if(!this.submissionGamejamForm.valid)
      {
        const controls = this.submissionGamejamForm.controls;
        for (const name in controls) {
            if (controls[name].invalid) {
              console.log(`Invalid field: ${name}`);
              console.log(`Value: ${controls[name].value}`);
              console.log(`Errors:`, controls[name].errors);
            }
        }
        this.message.showMessage("Error", "Please fill all the required fields");
      }
      else
      {
        const contactIndex: number = this.submissionGamejamForm.get('contact')?.value;
        const contact: any = {
          _id: this.team.jammers[contactIndex]._id,
          name: "",
          email: ""
        }

        const submission: Submission = {
          jamId : this.jam._id!,
          siteId: this.site._id!,
          teamId: this.team._id!,
          jammerId: this.user._id!,
          gamejamTitle: this.submissionGamejamForm.get('title')?.value,
          gamejamContact: contact,
          gamejamBuild: this.submissionGamejamForm.get('link')?.value,
          gamejamDescription: this.submissionGamejamForm.get('description')?.value,
          gamejamThemes: this.gameThemes,
          gamejamCategories: this.gameCategories,
          gamejamGenres: this.gameGenres,
          gamejamTopics: this.gameTopics,
          gamejamPlatforms: this.gamePlatforms,
          gamejamGraphics: this.submissionGamejamForm.get('graphics')?.value,
          gamejamEngine: this.submissionGamejamForm.get('engine')?.value,
          goingToIncubation: this.submissionGamejamForm.get('goingToIncubation')?.value,
          gamejamRecommendation: this.submissionGamejamForm.get('recommendation')?.value,
          gamejamEnjoyment: this.submissionGamejamForm.get('enjoyment')?.value,
          gamejamSuggestions: this.submissionGamejamForm.get('suggestions')?.value,
          gamejamAuthorization: this.submissionGamejamForm.get('authorization')?.value,
          gamejamSubmissionTime: new Date(),
          gamejamSubmissionDelta: this.getStageTimeDelta(this.JamStages.GAMEJAM)
        };

        this.submissionService.createSubmission(submission).subscribe({
          next: (submission: Submission) => {
            this.submission = submission;
            this.patchSubmissionForm(submission);
            this.message.showMessage("Success", "Submission accepted");
          },
          error: (error) => {
            this.message.showMessage("Error", error.error.message);
          }
        });
      }
    }
  }
//
  savePitch()
  {
    if(this.jam && this.site && this.team)
    {
      let pitch = {
        jamId: this.jam._id,
        siteId: this.site._id,
        teamId: this.team._id,
        link: this.submissionPitchGamejamForm.get('link')?.value,
        acceleration: this.submissionPitchGamejamForm.get('acceleration')?.value,
        pitchTimeDelta: this.getRelativePitchDelta()
      }
      console.log(pitch);

      this.submissionService.updateGamejamPitch(pitch).subscribe({
        next: (submission: Submission) => {
          this.submission = submission;
            this.patchSubmissionForm(submission);
            this.message.showMessage("Success", "Submission updated");
        },
        error: (error) => {
          this.message.showMessage("Error", error.error.message);
        }
      });
    }
  }
// Update safeness of this function
  saveGamejamPitch()
  {
    if(this.jam && this.site && this.team)
    {
      let gamejamPitch = {
        link: this.submissionPitchGamejamForm.get('link')?.value,
        jammerId: this.user._id,
        acceleration: this.submissionPitchGamejamForm.get('acceleration')?.value,
        pitchTimeDelta: this.getRelativePitchDelta()
      }
      console.log(gamejamPitch);

      if (this.submission && this.submission._id) {
        this.submissionService.putGamejamPitch(this.submission._id, gamejamPitch).subscribe({
          next: (submission: Submission) => {
            this.submission = submission;
            this.patchSubmissionForm(submission);
            this.message.showMessage("Success", "Submission updated");
          },
          error: (error) => {
            this.message.showMessage("Error", error.error.message);
          }
        });
      }
    }
  }

  saveIncubation() {
    if(this.jam && this.site && this.team) 
    {
      if(!this.submissionIncubationForm.valid) 
      {
        const controls = this.submissionIncubationForm.controls;
        for (const name in controls) {
            if (controls[name].invalid) {
                console.log(`Invalid field: ${name}`);
                console.log(`Value: ${controls[name].value}`);
                console.log(`Errors:`, controls[name].errors);
            }
        }
        this.message.showMessage("Error", "Please fill all the required fields");
      }
      else
      {

      }
    }
  }

  savePitchIncubation() {
    if(this.jam && this.site && this.team) 
    {
      if(!this.submissionPitchIncubationForm.valid) 
      {
        const controls = this.submissionPitchIncubationForm.controls;
        for (const name in controls) {
            if (controls[name].invalid) {
                console.log(`Invalid field: ${name}`);
                console.log(`Value: ${controls[name].value}`);
                console.log(`Errors:`, controls[name].errors);
            }
        }
        this.message.showMessage("Error", "Please fill all the required fields");
      }
      else
      {
        const incubationPitchData = {
          incubationPitchJammerId: this.user._id,
          incubationPitch: this.submissionPitchIncubationForm.get('incubationPitch')?.value,
          incubationPitchTime: new Date(),
        }
      }
    }
  }
  
  saveAcceleration()
  {
    if(this.jam && this.site && this.team)
    {
      if(!this.submissionAccelerationForm.valid)
      {
        const controls = this.submissionAccelerationForm.controls;
        for (const name in controls) {
            if (controls[name].invalid) {
                console.log(`Invalid field: ${name}`);
                console.log(`Value: ${controls[name].value}`);
                console.log(`Errors:`, controls[name].errors);
            }
        }
        this.message.showMessage("Error", "Please fill all the required fields");
      }
      else
      {
        let acceleration = {
          jamId: this.jam._id,
          siteId: this.site._id,
          teamId: this.team._id,
          accelerationBuildLink: this.submissionAccelerationForm.get('accelerationBuildLink')?.value,
          accelerationPitchVideo: this.submissionAccelerationForm.get('accelerationPitchVideo')?.value,
          accelerationGameplayVideo: this.submissionAccelerationForm.get('accelerationGameplayVideo')?.value,
          accelerationSoundtrack: this.submissionAccelerationForm.get('accelerationSoundtrack')?.value,
          accelerationPlatforms: this.submissionAccelerationForm.get('accelerationPlatforms')?.value,
          accelerationTimeDelta: this.getAccelerationTimeDelta(),
          recommendationAcceleration: this.submissionAccelerationForm.get('recommendationAcceleration')?.value,
          enjoymentAcceleration: this.submissionAccelerationForm.get('enjoymentAcceleration')?.value
        }
        console.log('Sending acceleration data:', acceleration);

        this.submissionService.updateAcceleration(acceleration).subscribe({
          next: (submission: Submission) => {
            this.submission = submission;
            this.patchSubmissionForm(submission);
            this.message.showMessage("Success", "Acceleration submission updated");
          },
          error: (error) => {
            this.message.showMessage("Error", error.error.message);
          }
        });
      }
    }
  }

  savePitchAcceleration() {
    if(this.jam && this.site && this.team) 
    {
      if(!this.submissionPitchAccelerationForm.valid) 
      {
        const controls = this.submissionAccelerationForm.controls;
        for (const name in controls) {
            if (controls[name].invalid) {
                console.log(`Invalid field: ${name}`);
                console.log(`Value: ${controls[name].value}`);
                console.log(`Errors:`, controls[name].errors);
            }
        }
        this.message.showMessage("Error", "Please fill all the required fields");
      }
      else
      {

      }
    }
  }

  getCurrentStageName(): string 
  {
    if (!this.jam) return '';
    
    const currentStage = this.getCurrentStage();
    return currentStage ? currentStage.stageName : '';
  }

  isStageActive(stage: JamStage): boolean {
    if (!this.jam || !this.jam.stages) return false

    const found = this.jam.stages.find(s => s.stageName === stage);
    if (!found) return false;
    
    const now = new Date().getTime();
    const start = this.offsetDate(found.startDate).getTime();
    const end = this.offsetDate(found.endDate).getTime();
    return now >= start && now <= end;
  }

  isStageActiveWithDelay(stage: JamStage): boolean {
    const targetStage = this.jam?.stages.find(s => s.stageName === stage);
    
    if (!targetStage) return false;
    
    const currentTime = new Date().getTime();
    const stageStartTime = this.offsetDate(targetStage.startDate).getTime();
    const stageEndTime = this.offsetDate(targetStage.endDate).getTime();
    
    return currentTime >= stageStartTime &&
            currentTime <= stageEndTime + SUBMISSION_GRACE_PERIOD_MS;
  }

  hasSubmittedGame(): boolean {
    return this.submission !== undefined && 
           this.submission !== null && 
           this.submission.gamejamBuild !== undefined && 
           this.submission.gamejamBuild !== null && 
           this.submission.gamejamBuild !== '';
  }

  hasSubmittedPitch(): boolean {
    return this.submission !== undefined && 
           this.submission !== null && 
           this.submission.gamejamPitch !== undefined && 
           this.submission.gamejamPitch !== null && 
           this.submission.gamejamPitch !== '';
  }

  hasSubmittedAcceleration(): boolean {
    return this.submission !== undefined && 
           this.submission !== null && 
           this.submission.accelerationBuild !== undefined && 
           this.submission.accelerationBuild !== null && 
           this.submission.accelerationBuild !== '';
  }

  hasStagePassed(stage: JamStage): boolean {
    if (!this.jam || !this.jam.stages) {
      return false;
    }
    const stageData = this.jam.stages.find(s => s.stageName === stage);
    if (!stageData) {
      return false;
    }
    const hasPassed = this.offsetDate(stageData.endDate).getTime() < new Date().getTime();
    return hasPassed;
  }

  // TODO: Put the other cases here
  getBackgroundClass(stage: JamStage): string {
    switch(stage) {
      case JamStage.GAMEJAM:
        return this.hasSubmittedGame()
          ? 'bg-success'
          : this.getStageTimeDelta(this.JamStages.GAMEJAM) > 0
            ? 'bg-warning'
            : 'bg-danger';
      case JamStage.PITCH_SUBMISSION:
        return this.hasSubmittedPitch()
          ? 'bg-success'
          : this.getStageTimeDelta(this.JamStages.PITCH_SUBMISSION) > 0
            ? 'bg-warning'
            : 'bg-danger';
      case JamStage.ACCELERATION_SUBMISSION:
        return this.hasSubmittedAcceleration()
          ? 'bg-success'
          : this.getStageTimeDelta(this.JamStages.ACCELERATION_SUBMISSION) > 0
            ? 'bg-warning'
            : 'bg-danger';
      
      
      default:
        return '';
    }
  }

  // getJamStageValues(stage: JamStage): Stage | null {
  //   if (!this.jam || !this.jam.stages) {
  //     return null;
  //   }
    
  //   const stageData = this.jam.stages.find(s => s.stageName === stage);
  //   if (!stageData) {
  //     return null;
  //   }

  //   return {
  //     ...stageData,
  //     name: stageData.stageName,
  //     startDate: this.offsetDate(stageData.startDate),
  //     endDate: this.offsetDate(stageData.endDate),
  //   };
  // }
}
