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
import { User, Site, Region, Country, Jam, Stage, Team, Submission, JamStage, JamStageColors, getJamStageColor, toJamStage } from '../../types';
import { TranslatePipe } from '@ngx-translate/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { faSitemap } from '@fortawesome/free-solid-svg-icons';
import { faPalette } from '@fortawesome/free-solid-svg-icons';
import { faFilePowerpoint } from '@fortawesome/free-solid-svg-icons';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
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
        DataFormComponent,
        TranslatePipe
    ]
})
export class JammerHomeComponent implements OnInit, OnDestroy {
  @Input() user!: User;
  @ViewChild(MessagesComponent) message!: MessagesComponent;

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

  rulesLink = "/rules";
  itchioLink = "https://itch.io/jam/gamejamplus-2425";

  availableGenres = [
    "Action",
    "Adventure",
    "Educational",
    "Hypercasual",
    "Multiplayer",
    "Narrative",
    "Platforming",
    "Puzzle",
    "Runner",
    "Sandbox",
    "Shooter"
  ]

  availableTopics = [
    "Business",
    "Sustentability",
    "Educational",
    "For Children",
    "Diversity",
    "Environment",
    "Originary/Native People",
    "Historical Facts",
    "Health",
    "Inclussion and Accessibility",
    "Folk Tales",
    "Finantial Education",
    "Music or Rhythm",
    "Mental Health"
  ]

  availablePlatforms = [
    "PC",
    "Console",
    "Mobile",
    "VR/AR",
    "Board Game",
    "Other"
  ]

  availableGraphics = [
    "2D",
    "2.5D",
    "3D",
    "Other"
  ]

  availableEngines = [
    "Unity",
    "Unreal",
    "Godot",
    "GameMaker",
    "Construct",
    "RPGMaker",
    "Other"
  ]

  faCoffee = faCoffee;
  faCircleInfo = faCircleInfo;
  faSitemap = faSitemap;
  faPalette = faPalette;
  faFilePowerpoint = faFilePowerpoint;
  faUsers = faUsers;
  faUser = faUser;
  faDiscord = faDiscord;
  faCrown = faCrown;
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
    this.submissionGamejamForm = this.fb.group({
      gamejamTitle: ['', Validators.required],
      gamejamBuild: ['', Validators.required],
      gamejamContact: ['', Validators.required],
      gamejamDescription: ['', Validators.required],
      gamejamGenres: [[], Validators.required],
      gamejamTopics: [[], Validators.required],
      gamejamThemes: [[], Validators.required],
      gamejamCategories: [[], Validators.required],
      gamejamPlatforms: [[], Validators.required],
      gamejamGraphics: ['', Validators.required],
      gamejamEngine: ['', Validators.required],
      goingToIncubation: [null, Validators.required],
      gamejamRecommendation: [null],
      gamejamEnjoyment: [null],
      gamejamSuggestions: [''],
      gamejamAuthorization: [null, Validators.required]
    });

    this.submissionPitchGamejamForm = this.fb.group({
      gamejamPitch: ['', 
        [
          Validators.required,
          Validators.pattern(/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(?:-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|live\/|v\/)?)([\w\-]+)(\S+)?$/)
        ]
      ]
    });

    this.submissionIncubationForm = this.fb.group({
      incubationTitle: ['', Validators.required],
      incubationBuild: ['', Validators.required],
      incubationContact: ['', Validators.required],
      incubationDescription: ['', Validators.required],
      incubationGenres: [[], Validators.required],
      incubationTopics: [[], Validators.required],
      incubationThemes: [[], Validators.required],
      incubationCategories: [[], Validators.required],
      incubationPlatforms: [[], Validators.required],
      incubationGraphics: ['', Validators.required],
      incubationEngine: ['', Validators.required],
      goingToAcceleration: [null, Validators.required],
      incubationRecommendation: [null],
      incubationEnjoyment: [null],
      incubationSuggestions: [''],
      incubationAuthorization: [null, Validators.required]
    });

    this.submissionPitchIncubationForm = this.fb.group({
      incubationPitch: ['', 
        [
          Validators.required,
          Validators.pattern(/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(?:-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|live\/|v\/)?)([\w\-]+)(\S+)?$/)
        ]
      ]
    });

    this.submissionAccelerationForm = this.fb.group({
      accelerationTitle: ['', Validators.required],
      accelerationBuild: ['', Validators.required],
      accelerationContact: ['', Validators.required],
      accelerationDescription: ['', Validators.required],
      accelerationGenres: [[], Validators.required],
      accelerationTopics: [[], Validators.required],
      accelerationThemes: [[], Validators.required],
      accelerationCategories: [[], Validators.required],
      accelerationPlatforms: [[], Validators.required],
      accelerationGraphics: ['', Validators.required],
      accelerationEngine: ['', Validators.required],
      accelerationRecommendation: [''],
      accelerationEnjoyment: [''],
      accelerationSuggestions: [''],
      accelerationAuthorization: [null, Validators.required]
    });

    this.submissionPitchAccelerationForm = this.fb.group({
      accelerationPitch: ['', 
        [
          Validators.required,
          Validators.pattern(/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(?:-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|live\/|v\/)?)([\w\-]+)(\S+)?$/)
        ]
      ]
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
    this.siteService.getCountries(`${environment.apiUrl}/api/site/get-countries`).subscribe({
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
        console.log("Jammer data: ", data.jammerData);
        if(data.jammerData.ethnicity && 
          data.jammerData.gender && 
          data.jammerData.intersex && 
          data.jammerData.orientation) this.jammerData = true;
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
      const url = `${environment.apiUrl}/api/team/get-team/${this.user._id}/${this.site._id}/${this.jam._id}`;
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
      console.log('Fetching submission for team:', this.team.teamName,'/', this.team._id);
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
      const url = `${environment.apiUrl}/api/team/create-team`;
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
        const url = `${environment.apiUrl}/api/team/join-jammer/${code}/${this.user._id}`;
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
      const url = `${environment.apiUrl}/api/team/update-team/${this.team._id}`;
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
    const url = `${environment.apiUrl}/api/user/get-site-staff/${this.site!._id}`;
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
    const url = `${environment.apiUrl}/api/region/get-regions`;
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
    const url = `${environment.apiUrl}/api/site/get-sites-per-jam/open`;
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
        const url = `${environment.apiUrl}/api/site/join-site`;
        this.siteService.joinSite(url, {
          userId: this.user._id,
          siteId: site._id,
          jamId: this.jam?._id
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

  hasJammerData() {

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
            const url = `${environment.apiUrl}/api/site/exit-site`;
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
            const url = `${environment.apiUrl}/api/team/remove-jammer/${this.team._id}/${this.user._id}`;
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
      return 'card text-white double-border';
    }
    else
    {
      return 'card';
    }
  }

  getStageStyle(stage: any)
  {
    const enumStage = toJamStage(stage?.stageName);
    const bg = enumStage ? getJamStageColor(enumStage) : '#9CA3AF';
    return { 'background-color': bg };
  }

  //TODO: CAN REMOVE THIS FUNCTION
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

  // TODO: REMOVE THIS LATER
  // getRelativePitchDelta()
  // {
  //   if(this.jam && this.site && this.team)
  //   {
  //     if(this.site.customSubmissionTime)
  //     {
  //       let endDate = new Date(this.site.customSubmissionTime);
  //       endDate = new Date((endDate.getTime() + 48*60*60*1000));
  //       let now = new Date();
  //       let delta = endDate.getTime() - now.getTime();
  //       return delta;
  //     }

  //     let now = new Date();
  //     let offset = now.getTimezoneOffset() * 60000;
  //     now = new Date((now.getTime() - offset));
  //     let currentStage: any = null;

  //     for(let s = 0; s < this.jam.stages.length; ++s)
  //     {
  //       if(this.jam.stages[s].stageName == JamStage.PITCH_SUBMISSION)
  //       {
  //         let endDate = new Date(this.jam.stages[s].endDate);
  //         //endDate = new Date(endDate.getTime() - (180 * 60000) + (48*60*60*1000));
  //         endDate = new Date(endDate.getTime() - (180 * 60000));

  //         return endDate.getTime() - now.getTime();
  //       }
  //     }
  //   }
  //   return 0;
  // }

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

      // GAMEJAM FORM
      if(this.submission?.gamejamBuild) {
        for(let i = 0; i < this.team.jammers.length; ++i)
        {
          if(this.team.jammers[i]._id == this.submission.gamejamContact._id) contact = i; break;
        }
        
        this.submissionGamejamForm.patchValue({
          gamejamTitle: submission.gamejamTitle,
          gamejamBuild: submission.gamejamBuild,
          gamejamContact: contact,
          gamejamDescription: submission.gamejamDescription,
          gamejamGenres: submission.gamejamGenres,
          gamejamTopics: submission.gamejamTopics,
          gamejamThemes: submission.gamejamThemes,
          gamejamCategories: submission.gamejamCategories,
          gamejamPlatforms: submission.gamejamPlatforms,
          gamejamGraphics: submission.gamejamGraphics,
          gamejamEngine: submission.gamejamEngine,
          goingToIncubation: submission.goingToIncubation,
          gamejamRecommendation: submission.gamejamRecommendation,
          gamejamEnjoyment: submission.gamejamEnjoyment,
          gamejamSuggestions: submission.gamejamSuggestions,
          gamejamAuthorization: submission.gamejamAuthorization
        });
      }
     
      // GAMEJAM PITCH FORM
      if(this.submission?.gamejamPitch) {
        this.submissionPitchGamejamForm.patchValue({
          gamejamPitch: submission.gamejamPitch
        })
      }

      // INCUBATION FORM
      if(this.submission?.incubationBuild) {
        for(let i = 0; i < this.team.jammers.length; ++i)
        {
          if(this.team.jammers[i]._id == this.submission.incubationContact?._id) contact = i; break;
        }

        this.submissionIncubationForm.patchValue({
          incubationTitle: submission.incubationTitle,
          incubationBuild: submission.incubationBuild,
          incubationContact: contact,
          incubationDescription: submission.incubationDescription,
          incubationGenres: submission.incubationGenres,
          incubationTopics: submission.incubationTopics,
          incubationThemes: submission.incubationThemes,
          incubationCategories: submission.incubationCategories,
          incubationPlatforms: submission.incubationPlatforms,
          incubationGraphics: submission.incubationGraphics,
          incubationEngine: submission.incubationEngine,
          goingToAcceleration: submission.goingToAcceleration,
          incubationRecommendation: submission.incubationRecommendation,
          incubationEnjoyment: submission.incubationEnjoyment,
          incubationSuggestions: submission.incubationSuggestions,
          incubationAuthorization: submission.incubationAuthorization
        });
      } else {
        this.submissionIncubationForm.patchValue({
          incubationTitle: submission.gamejamTitle,
          incubationBuild: submission.gamejamBuild,
          incubationContact: contact,
          incubationDescription: submission.gamejamDescription,
          incubationGenres: submission.gamejamGenres,
          incubationTopics: submission.gamejamTopics,
          incubationThemes: submission.gamejamThemes,
          incubationCategories: submission.gamejamCategories,
          incubationPlatforms: submission.gamejamPlatforms,
          incubationGraphics: submission.gamejamGraphics,
          incubationEngine: submission.gamejamEngine,
          incubationRecommendation: submission.gamejamRecommendation,
          incubationEnjoyment: submission.gamejamEnjoyment,
          incubationSuggestions: submission.gamejamSuggestions,
        });
      }

      // INCUBATION PITCH FORM
      if(this.submission?.incubationPitch) {
        this.submissionPitchIncubationForm.patchValue({
          incubationPitch: submission.incubationPitch
        });
      } else {
        this.submissionPitchIncubationForm.patchValue({
          incubationPitch: submission.gamejamPitch
        });
      }

      // ACCELERATION FORM
      if(this.submission?.accelerationBuild) {
        for(let i = 0; i < this.team.jammers.length; ++i)
        {
          if(this.team.jammers[i]._id == this.submission.accelerationContact?._id) contact = i; break;
        }

        this.submissionAccelerationForm.patchValue({
          accelerationTitle: submission.accelerationTitle,
          accelerationBuild: submission.accelerationBuild,
          accelerationContact: contact,
          accelerationDescription: submission.accelerationDescription,
          accelerationGenres: submission.accelerationGenres,
          accelerationTopics: submission.accelerationTopics,
          accelerationThemes: submission.accelerationThemes,
          accelerationCategories: submission.accelerationCategories,
          accelerationPlatforms: submission.accelerationPlatforms,
          accelerationGraphics: submission.accelerationGraphics,
          accelerationEngine: submission.accelerationEngine,
          accelerationRecommendation: submission.accelerationRecommendation,
          accelerationEnjoyment: submission.accelerationEnjoyment,
          accelerationSuggestions: submission.accelerationSuggestions,
          accelerationAuthorization: submission.accelerationAuthorization
        });
      } else {
        this.submissionAccelerationForm.patchValue({
          accelerationTitle: submission.incubationTitle,
          accelerationBuild: submission.incubationBuild,
          accelerationContact: contact,
          accelerationDescription: submission.incubationDescription,
          accelerationGenres: submission.incubationGenres,
          accelerationTopics: submission.incubationTopics,
          accelerationThemes: submission.incubationThemes,
          accelerationCategories: submission.incubationCategories,
          accelerationPlatforms: submission.incubationPlatforms,
          accelerationGraphics: submission.incubationGraphics,
          accelerationEngine: submission.incubationEngine,
          accelerationRecommendation: submission.incubationRecommendation,
          accelerationEnjoyment: submission.incubationEnjoyment,
          accelerationSuggestions: submission.incubationSuggestions,
        });
      }

      // ACCELERATION PITCH FORM
      if(this.submission?.accelerationPitch) {
        this.submissionPitchAccelerationForm.patchValue({
          accelerationPitch: submission.accelerationPitch
        });
      } else {
        this.submissionPitchAccelerationForm.patchValue({
          accelerationPitch: submission.incubationPitch
        });
      }

      console.log("Patching with submission: ", submission);
    }
  }

  patchGamejamPitchForm(submission: any) {
    if (submission && submission.gamejamPitch) {
      this.submissionPitchGamejamForm.patchValue({
        gamejamPitch: submission.gamejamPitch,
      });
    }
  }

  saveGamejamSubmission()
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
        const formValues = this.submissionGamejamForm.value;

        const contactIndex: number = formValues.gamejamContact;
        
        const contact: any = {
          _id: this.team.jammers[contactIndex]._id,
          name: "",
          email: ""
        }

        const submission: Submission = {
          jamId : this.jam._id!,
          siteId: this.site._id!,
          teamId: this.team._id!,
          gamejamJammerId: this.user._id!,
          gamejamTitle: formValues.gamejamTitle,
          gamejamBuild: formValues.gamejamBuild,
          gamejamContact: contact,
          gamejamDescription: formValues.gamejamDescription,
          gamejamGenres: formValues.gamejamGenres,
          gamejamTopics: formValues.gamejamTopics,
          gamejamThemes: formValues.gamejamThemes,
          gamejamCategories: formValues.gamejamCategories,
          gamejamPlatforms: formValues.gamejamPlatforms,
          gamejamGraphics: formValues.gamejamGraphics,
          gamejamEngine: formValues.gamejamEngine,
          goingToIncubation: formValues.goingToIncubation,
          gamejamRecommendation: formValues.gamejamRecommendation,
          gamejamEnjoyment: formValues.gamejamEnjoyment,
          gamejamSuggestions: formValues.gamejamSuggestions,
          gamejamAuthorization: formValues.gamejamAuthorization,
          gamejamSubmissionTime: new Date(),
          gamejamSubmissionDelta: this.getStageTimeDelta(this.JamStages.GAMEJAM)
        };

        this.submissionService.createSubmission(submission).subscribe({
          next: (submission: Submission) => {
            this.getSubmission();
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

  savePitchGamejam()
  {
    if(this.jam && this.site && this.team)
    {
      if(!this.submissionPitchGamejamForm.valid)
      {
        this.submissionPitchGamejamForm.markAllAsTouched();
        const errorMsg = this.getPitchErrorMessage();
        this.message.showMessage("Error", errorMsg || "Please correct the highlighted fields");
      }
      else 
      {
        let pitch = {
          jamId: this.jam._id,
          siteId: this.site._id,
          teamId: this.team._id,
          gamejamPitchJammerId: this.user._id,
          gamejamPitch: this.submissionPitchGamejamForm.get('gamejamPitch')?.value,
          gamejamPitchTime: new Date(),
          gamejamPitchDelta: this.getStageTimeDelta(this.JamStages.GAMEJAM_SUBMISSION)
        }

        this.submissionService.updateGamejamPitch(pitch).subscribe({
          next: (submission: any) => {
              this.patchGamejamPitchForm(submission);
              this.message.showMessage("Success", "Submission updated");
          },
          error: (error) => {
            this.message.showMessage("Error", error.error.message);
          }
        });
      }
    }
  }

  saveIncubationSubmission() {
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
        const formValues = this.submissionIncubationForm.value;

        const contactIndex: number = formValues.incubationContact;
        
        const contact: any = {
          _id: this.team.jammers[contactIndex]._id,
          name: "",
          email: ""
        }

        let incubationSubmission = {
          jamId: this.jam._id!,
          siteId: this.site._id!,
          teamId: this.team._id!,
          incubationJammerId: this.user._id!,
          incubationTitle: formValues.incubationTitle,
          incubationBuild: formValues.incubationBuild,
          incubationContact: contact,
          incubationDescription: formValues.incubationDescription,
          incubationGenres: formValues.incubationGenres,
          incubationTopics: formValues.incubationTopics,
          incubationThemes: formValues.incubationThemes,
          incubationCategories: formValues.incubationCategories,
          incubationPlatforms: formValues.incubationPlatforms,
          incubationGraphics: formValues.incubationGraphics,
          incubationEngine: formValues.incubationEngine,
          goingToAcceleration: formValues.goingToAcceleration,
          incubationRecommendation: formValues.incubationRecommendation,
          incubationEnjoyment: formValues.incubationEnjoyment,
          incubationSuggestions: formValues.incubationSuggestions,
          incubationAuthorization: formValues.incubationAuthorization,
          incubationSubmissionTime: new Date(),
          incubationSubmissionDelta: this.getStageTimeDelta(this.JamStages.INCUBATION)
        };

        this.submissionService.updateIncubation(incubationSubmission).subscribe({
          next: (submission: Submission) => {
            this.getSubmission();
            this.patchSubmissionForm(submission);
            this.message.showMessage("Success", "Incubation submission updated");
          },
          error: (error) => {
            this.message.showMessage("Error", error.error.message);
          }
        })
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
        const incubationPitch = {
          jamId: this.jam._id,
          siteId: this.site._id,
          teamId: this.team._id,
          incubationPitchJammerId: this.user._id,
          incubationPitch: this.submissionPitchIncubationForm.get('incubationPitch')?.value,
          incubationPitchTime: new Date(),
          incubationPitchDelta: this.getStageTimeDelta(this.JamStages.INCUBATION_SUBMISSION),
        };

        this.submissionService.updateIncubationPitch(incubationPitch).subscribe({
          next: (submission: any) => {
            this.patchGamejamPitchForm(submission);
            this.message.showMessage("Success", "Submission updated");
          },
          error: (error) => {
            this.message.showMessage("Error", error.error.message);
          }
        });
      }
    }
  }
  
  saveAccelerationSubmission()
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
            this.getSubmission();
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
        const accelerationPitch = {
          jamId: this.jam._id,
          siteId: this.site._id,
          teamId: this.team._id,
          accelerationPitchJammerId: this.user._id,
          accelerationPitch: this.submissionPitchAccelerationForm.get('accelerationPitch')?.value,
          accelerationPitchTime: new Date(),
          accelerationPitchDelta: this.getStageTimeDelta(this.JamStages.ACCELERATION_SUBMISSION),
        }

        this.submissionService.updateAccelerationPitch(accelerationPitch).subscribe({
          next: (submission: any) => {
            this.patchGamejamPitchForm(submission);
            this.message.showMessage("Success", "Submission updated");
          },
          error: (error) => {
            this.message.showMessage("Error", error.error.message);
          }
        });
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

  hasSubmittedOn(stage: JamStage): boolean {
    if (!this.submission) return false;
    
    switch (stage) {
      case JamStage.GAMEJAM:
        return this.submission.gamejamBuild !== undefined && 
               this.submission.gamejamBuild !== null && 
               this.submission.gamejamBuild !== '';
      
      case JamStage.GAMEJAM_SUBMISSION:
        return this.submission.gamejamPitch !== undefined && 
               this.submission.gamejamPitch !== null && 
               this.submission.gamejamPitch !== '';
      
      case JamStage.INCUBATION:
        return this.submission.incubationBuild !== undefined && 
               this.submission.incubationBuild !== null && 
               this.submission.incubationBuild !== '';
      
      case JamStage.INCUBATION_SUBMISSION:
        return this.submission.incubationPitch !== undefined && 
               this.submission.incubationPitch !== null && 
               this.submission.incubationPitch !== '';

      case JamStage.ACCELERATION:
        return this.submission.accelerationBuild !== undefined && 
               this.submission.accelerationBuild !== null && 
               this.submission.accelerationBuild !== '';

      case JamStage.ACCELERATION_SUBMISSION:
        return this.submission.accelerationPitch !== undefined && 
               this.submission.accelerationPitch !== null && 
               this.submission.accelerationPitch !== '';       
      
      default:
        return false;
    }
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

  getBackgroundClass(stage: JamStage): string {
    switch(stage) {
      case JamStage.GAMEJAM:
        return this.hasSubmittedOn(this.JamStages.GAMEJAM)
          ? 'bg-success'
          : this.getStageTimeDelta(this.JamStages.GAMEJAM) > 0
            ? 'bg-warning'
            : 'bg-danger';

      case JamStage.GAMEJAM_SUBMISSION:
        return this.hasSubmittedOn(this.JamStages.GAMEJAM_SUBMISSION)
          ? 'bg-success'
          : this.getStageTimeDelta(this.JamStages.GAMEJAM_SUBMISSION) > 0
            ? 'bg-warning'
            : 'bg-danger';

      case JamStage.INCUBATION:
        return this.hasSubmittedOn(this.JamStages.INCUBATION)
          ? 'bg-success'
          : this.getStageTimeDelta(this.JamStages.INCUBATION) > 0
            ? 'bg-warning'
            : 'bg-danger';

      case JamStage.INCUBATION_SUBMISSION:
        return this.hasSubmittedOn(this.JamStages.INCUBATION_SUBMISSION)
          ? 'bg-success'
          : this.getStageTimeDelta(this.JamStages.INCUBATION_SUBMISSION) > 0
            ? 'bg-warning'
            : 'bg-danger';

      case JamStage.ACCELERATION:
        return this.hasSubmittedOn(this.JamStages.ACCELERATION)
          ? 'bg-success'
          : this.getStageTimeDelta(this.JamStages.ACCELERATION) > 0
            ? 'bg-warning'
            : 'bg-danger';

      case JamStage.ACCELERATION_SUBMISSION:
        return this.hasSubmittedOn(this.JamStages.ACCELERATION_SUBMISSION)
          ? 'bg-success'
          : this.getStageTimeDelta(this.JamStages.ACCELERATION_SUBMISSION) > 0
            ? 'bg-warning'
            : 'bg-danger';   
      
      default:
        return '';
    }
  }

  // TODO: SUPPORT FOR OTHER LANGUAGES
  // TODO: MAKE WORK FOR THE OTHER PITCH FORMS
  getPitchErrorMessage(): string {
    const control = this.submissionPitchGamejamForm.get('gamejamPitch');
    if (!control) return '';
    if (control.hasError('required')) return 'O link do pitch é requirido';
    if (control.hasError('pattern')) return 'Por favor coloque uma URL do Youtube válida';
    return '';
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
