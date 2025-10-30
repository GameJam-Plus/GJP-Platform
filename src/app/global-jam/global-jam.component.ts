import { Component, ViewChild, ElementRef, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { Jam, Site, User, Team } from '../../types';
import { JamService } from '../services/jam.service';
import { SiteService } from '../services/site.service';
import { TeamService } from '../services/team.service';
import { UserService } from '../services/user.service';
import { SubmissionService } from '../services/submission.service';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment.prod';
import { CommonModule, formatDate } from '@angular/common';
import { MessagesComponent } from '../messages/messages.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { saveAs } from 'file-saver';
import { TranslatePipe } from '@ngx-translate/core';

import * as moment from 'moment-timezone';

import { faFileCsv } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-global-jam',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MessagesComponent,
    TranslatePipe
  ],
  templateUrl: './global-jam.component.html',
  styleUrl: './global-jam.component.css'
})

export class GlobalJamComponent {
  activeJam: Jam | null = null;
  selectedThemeIndex: number = -1;
  selectedCategoryIndex: number = -1;
  selectedStageIndex: number = -1;
  selectedSite: any = null;
  selectedJammers: any[] = [];
  timeZone: string = '';
  jamForm!: FormGroup;
  themeForm!: FormGroup;
  categoryForm!: FormGroup;
  stageForm!: FormGroup;
  errorMessage: string = '';
  warningMessage: string = '';
  jamData: any = {};
  activeSites: any[] = [];
  inactiveSites: any[] = [];
  submissions: any[] = [];
  teamColors: any = {};
  activeUsersRequest: string = '';
  activeUsers: any[] = [];
  inactiveUsers: any[] = [];
  submissionsData: any[] = [];

  faFileCsv = faFileCsv;

  @Input() page: string = '';

  @ViewChild(MessagesComponent) message!: MessagesComponent;
  @ViewChild('closeStageModal') closeStageModal?: ElementRef;
  @ViewChild('siteInfoModal') siteInfoModal?: ElementRef;

  constructor(private route: ActivatedRoute, private jamService: JamService, private siteService: SiteService, private userService: UserService, private submissionService: SubmissionService, private fb: FormBuilder){}

  ngOnInit(): void {
    this.loadActiveJam();
    this.getSitesInfo();

    // Add modal event listener
    const modalElement = document.getElementById('siteInfoModal');
    if (modalElement) {
      modalElement.addEventListener('hidden.bs.modal', () => {
        this.clearSite();
        document.body.classList.remove('modal-open');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
      });
    }

    console.log(`The page is ${this.page}`);

    this.jamForm = this.fb.group({
      title: ['', Validators.required],
      toolboxGuides: [''],
      toolboxArts: [''],
      toolboxPresentations: [''],
      open: [''],
      public: ['']
    });

    this.themeForm = this.fb.group({
      titlePT: ['', Validators.required],
      titleES: ['', Validators.required],
      titleEN: ['', Validators.required],
      descriptionPT: [''],
      descriptionES: [''],
      descriptionEN: [''],
      manualPT: [''],
      manualES: [''],
      manualEN: ['']
    });

    this.categoryForm = this.fb.group({
      titlePT: ['', Validators.required],
      titleES: ['', Validators.required],
      titleEN: ['', Validators.required],
      descriptionPT: [''],
      descriptionES: [''],
      descriptionEN: [''],
      manualPT: [''],
      manualES: [''],
      manualEN: ['']
    });

    this.stageForm = this.fb.group({
      stageName: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      roleGlobal: [false],
      roleLocal: [false],
      roleJudge: [false],
      roleJammer: [false]
    });

    //let now = new Date();
    //let tzOffset = now.getTimezoneOffset();
    //this.timeZone = tzOffset > 0 ? `+${tzOffset}` : `${tzOffset}`;

    // BRT Time Zone
    let tzOffset = 180; // 3 hours * 60 minutes - BRT
    this.timeZone = tzOffset > 0 ? `+${tzOffset}` : `${tzOffset}`;
  }

// #region Main Functions

  loadActiveJam(): void {
    this.jamService.getCurrentJam().subscribe({
      next: (jam) => {
        console.log(`Jam found with id: ${jam._id}`);
        this.activeJam = jam;
        this.countJamData();
        this.patchJamForm();
      },
      error : (error) => {
        console.log(error.error.message);
      }
    });
  }

  countJamData(): void{
    if(this.activeJam)
    {
      this.jamService.countJamData(this.activeJam._id!).subscribe({
        next: (data) => {
          this.jamData = data;
          console.log(data);
        },
        error: (error) => {
          console.log(error);
        }
      });
    }
  }

  getSitesInfo(): void{
    this.siteService.getAllSitesInfo().subscribe({
      next: (data) => {
        this.activeSites = data.activeSites;
        this.inactiveSites = data.inactiveSites;
        console.log(data);
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  getSubmissions()
  {
    if(this.activeJam?._id)
    {
      this.submissionService.getSubmissionsByJam(this.activeJam._id).subscribe({
        next: (data) => {
          this.submissions = data;
        },
        error: (error) => {
          this.message.showMessage("Error", error.error.message);
        }
      });
    }
  }

  getActiveUsers()
  {
    if(this.activeJam?._id)
    {
      this.activeUsersRequest = "LOADING...";
      this.submissionService.getSubmissionsData(this.activeJam._id).subscribe({
        next: (data) => {
          this.activeUsersRequest = '';
          this.activeUsers = data.activeJammers;
          this.inactiveUsers = data.inactiveJammers;
          this.submissionsData = data.submissions;
          console.log(data.submissions.length);
        },
        error: (error) => {
          this.message.showMessage("Error", error.error.message);
        }
      });
    }
  }

  patchJamForm(): void{
    this.jamForm.setValue({
      title: this.activeJam?.title,
      toolboxGuides: this.activeJam?.toolboxGuides ? this.activeJam?.toolboxGuides : '',
      toolboxArts: this.activeJam?.toolboxArts ? this.activeJam?.toolboxArts : '',
      toolboxPresentations: this.activeJam?.toolboxPresentations ? this.activeJam?.toolboxPresentations : '',
      open: this.activeJam?.open,
      public: this.activeJam?.public
    })
  }

  setOpenValue(value: boolean): void
  {
    this.jamForm.controls['open'].setValue(value);
  }

  setPublicValue(value: boolean): void
  {
    this.jamForm.controls['public'].setValue(value);
  }

  exportJammers()
  {
    let rows = "#; Name; Email; Discord; Site; Country; Region; Team; Game Title; Link to Game; Link to Pitch; Incubation; Acceleration\n";
    this.activeUsers.forEach((jammer, index) => {
      const incubation = jammer.incubation ? 'YES' : 'NO';
      const acceleration = jammer.acceleration ? 'YES' : 'NO';
      rows += `${index + 1}; ${jammer.name}; ${jammer.email}; ${jammer.discordUsername}; ${jammer.siteName}; ${jammer.countryName}; ${jammer.regionName}; ${jammer.teamName}; ${jammer.submissionTitle}; ${jammer.submissionLink}; ${jammer.pitchLink}; ${incubation}; ${acceleration}\n`;
    });
    this.inactiveUsers.forEach((jammer, index) => {
      const incubation = jammer.incubation ? 'YES' : 'NO';
      const acceleration = jammer.acceleration ? 'YES' : 'NO';
      rows += `${index + 1}; ${jammer.name}; ${jammer.email}; ${jammer.discordUsername}; ${jammer.siteName}; ${jammer.countryName}; ${jammer.regionName}; ${jammer.teamName}; ${jammer.submissionTitle}; ${jammer.submissionLink}; ${jammer.pitchLink}; ${incubation}; ${acceleration}\n`;
    });
    rows = rows.trim();

    let blob = new Blob([rows], {type: 'text/csv;charset=utf-8'});
    saveAs(blob, "jammers.csv");
  }

  exportSubmissions()
  {
    let themesTitles = new Array();
    let themesHeader = '';
    for(let t = 0; t < this.activeJam!.themes.length; ++t)
    {
      themesTitles.push(this.activeJam!.themes[t].titleEN);
      themesHeader += 'Theme:' + this.activeJam!.themes[t].titleEN + ';';
    }

    let categoriesTitles = new Array();
    let categoriesHeader = '';
    for(let c = 0; c < this.activeJam!.themes.length; ++c)
    {
      categoriesTitles.push(this.activeJam!.categories[c].titleEN);
      categoriesHeader += 'Category:' + this.activeJam!.categories[c].titleEN + ';';
    }

    let genreTitles = ["Action", "Adventure", "Educational", "Hypercasual", "Multiplayer", "Narrative", "Platforming", "Puzzle", "Runner", "Sandbox", "Shooter"];
    let genreHeader = "Genre: Action; Genre: Adventure; Genre: Educational; Genre: Hypercasual; Genre: Multiplayer; Genre: Narrative; Genre: Platforming; Genre: Puzzle; Genre: Runner; Genre: Sandbox; Genre: Shooter;"

    let rows = `#; Id; Region; Country; Site; Team; Leader Name; Leader Email; Game Title; Link to Game; Description; Link to Pitch; Themes; ${themesHeader} Categories; ${categoriesHeader} Genres; ${genreHeader} Incubation; Acceleration; Submission Date; Submission Time; Pitch Date; Pitch Time\n`;
    this.submissions.forEach((s, i) => {
      const incubation = s.incubation ? 'YES' : 'NO';
      const acceleration = s.acceleration ? 'YES' : 'NO';
      let submissionDate = 'NONE';
      let submissionTime = 'NONE';

      if(s.submissionTime)
      {
        submissionDate = s.submissionTime.split('T')[0];
        submissionTime = s.submissionTime.split('T')[1].slice(0, -5);
      }

      let pitchDate = 'NONE';
      let pitchTime = 'NONE';

      let themes = '';
      let themesSummary = '';
      for(let t = 0; t < themesTitles.length; ++t)
      {
        if(s.themes.includes(themesTitles[t]))
        {
          themes += 'YES;';
          themesSummary += themesTitles[t] + ', ';
        }
        else
        {
          themes += 'NO;';
        }
      }


      let categories = '';
      let categoriesSummary = '';
      for(let c = 0; c < categoriesTitles.length; ++c)
      {
        if(s.categories.includes(categoriesTitles[c]))
        {
          categories += 'YES;';
          categoriesSummary += categoriesTitles[c] + ', '
        }
        else
        {
          categories += 'NO;';
        }
      }

      let genres = '';
      let genreSummary = '';
      for(let g = 0; g < genreTitles.length; ++g)
      {
        if(s.genres.includes(genreTitles[g]))
        {
          genres += 'YES;';
          genreSummary += genreTitles[g] + ',';
        }
        else
        {
          genres += 'NO;';
        }
      }

      if(s.pitchTime)
      {
        pitchDate = s.pitchTime.split('T')[0];
        pitchTime = s.pitchTime.split('T')[1].slice(0, -5);
      }
      let description = s.description;
      description = description.replace(/;/g, ',');
      description = description.replace(/\n/g, '.');
      if(s.title == "The Chill Protector") console.log(description);
      rows += `${i}; ${s._id}; ${s.region}; ${s.country}; ${s.site}; ${s.teamName}; ${s.contact.name}; ${s.contact.email}; ${s.title}; ${s.link}; ${description}; ${s.pitch}; ${themesSummary} ; ${themes} ${categoriesSummary} ; ${categories} ${genreSummary} ; ${genres} ${incubation}; ${acceleration}; ${submissionDate}; ${submissionTime}; ${pitchDate}; ${pitchTime}\n`;
    });

    let blob = new Blob([rows], {type: 'text/csv;charset=utf-8'});
    saveAs(blob, "submissions.csv");
  }

  createJam(): void{
    this.jamService.createJam({
      title: 'New Game Jam',
      open: true,
      public: false,
      themes: [],
      categories: [],
      stages: [],
      toolboxGuides: '',
      toolboxArts: '',
      toolboxPresentations: '',
    }).subscribe({
      next: (data)=>{
        if(data.success)
        {
          console.log(`Jam created successfully with ID: ${data.jamId}`);
          this.loadActiveJam();
        }
      },
      error: (error)=>{
        console.log(error.error.message);
        this.message.showMessage("Error", error.error.message);
      }
    });
  }

  updateJam(): void{
    if(this.activeJam)
    {
      if(this.jamForm.valid)
      {
        let title: string = (this.jamForm.get('title')?.value) ? this.jamForm.get('title')?.value : this.activeJam.title;
        let open = this.jamForm.get('open')?.value;
        let published = this.jamForm.get('public')?.value;
        let toolboxGuides = this.jamForm.get('toolboxGuides')?.value ? this.jamForm.get('toolboxGuides')?.value : this.activeJam.toolboxGuides;
        let toolboxArts = this.jamForm.get('toolboxArts')?.value ? this.jamForm.get('toolboxArts')?.value : this.activeJam.toolboxArts;
        let toolboxPresentations = this.jamForm.get('toolboxPresentations')?.value ? this.jamForm.get('toolboxPresentations')?.value : this.activeJam.toolboxPresentations;

        const jam: Jam = {
          title: title,
          open: open,
          public: published,
          toolboxGuides: toolboxGuides,
          toolboxArts: toolboxArts,
          toolboxPresentations: toolboxPresentations,
          themes: this.activeJam.themes,
          categories: this.activeJam.categories,
          stages: this.activeJam.stages
        };

        console.log(jam);

        this.jamService.updateJam(this.activeJam._id!, jam).subscribe({
          next: (data) => {
            if(data.success)
            {
              this.message.showMessage("Success", data.message);
              this.loadActiveJam();
            }
            else
            {
              this.message.showMessage("Error", data.message);
            }
          },
          error: (error) => {
            console.log(error);
            this.message.showMessage("Error", error.error.message);
          }
        });
      }
    }
  }
// #endregion

// #region Themes Functions

  patchThemeForm(index: number): void{
    this.selectedThemeIndex = index;
    if(index >= 0 && index < this.activeJam!.themes.length)
    {
      let theme = this.activeJam!.themes[index];
      this.themeForm.setValue({
        titlePT: theme.titlePT,
        titleES: theme.titleES,
        titleEN: theme.titleEN,
        manualPT: theme.manualPT,
        manualES: theme.manualES,
        manualEN: theme.manualEN,
        descriptionPT: theme.descriptionPT,
        descriptionES: theme.descriptionES,
        descriptionEN: theme.descriptionEN
      });
    }
    else
    {
      this.clearThemeForm();
    }
  }

  clearThemeForm()
  {
    this.themeForm.setValue({
      titlePT: "",
      titleES: "",
      titleEN: "",
      manualPT: "",
      manualES: "",
      manualEN: "",
      descriptionPT: "",
      descriptionES: "",
      descriptionEN: ""
    });
  }

  saveTheme(): void{
    let theme = {
      titlePT: this.themeForm.get('titlePT')!.value,
      titleES: this.themeForm.get('titleES')!.value,
      titleEN: this.themeForm.get('titleEN')!.value,
      descriptionPT: this.themeForm.get('descriptionPT')!.value,
      descriptionES: this.themeForm.get('descriptionES')!.value,
      descriptionEN: this.themeForm.get('descriptionEN')!.value,
      manualPT: this.themeForm.get('manualPT')!.value,
      manualES: this.themeForm.get('manualES')!.value,
      manualEN: this.themeForm.get('manualEN')!.value
    };

    if(this.selectedThemeIndex >= 0)
    {
      this.activeJam!.themes[this.selectedThemeIndex] = theme;
    }
    else
    {
      this.activeJam?.themes.push(theme);
    }

    this.clearThemeForm();
  }

  deleteTheme(index: number)
  {
    let theme = this.activeJam!.themes[index];
    this.message.showDialog(
      "Confirm Action",
      `Delete theme with title ${theme.titlePT}?`, () => {
        if(index >= 0 && index < this.activeJam!.themes.length)
          {
            this.activeJam?.themes.splice(index, 1);
          }
      });
  }

// #endregion

// #region Categories Functions

  patchCategoryForm(index: number): void{
    this.selectedCategoryIndex = index;
    if(index >= 0 && index < this.activeJam!.categories.length)
    {
      let category = this.activeJam!.categories[index];
      this.categoryForm.setValue({
        titlePT: category.titlePT,
        titleES: category.titleES,
        titleEN: category.titleEN,
        manualPT: category.manualPT,
        manualES: category.manualES,
        manualEN: category.manualEN,
        descriptionPT: category.descriptionPT,
        descriptionES: category.descriptionES,
        descriptionEN: category.descriptionEN
      });
    }
    else
    {
      this.clearCategoryForm();
    }
  }

  clearCategoryForm()
  {
    this.categoryForm.setValue({
      titlePT: "",
      titleES: "",
      titleEN: "",
      manualPT: "",
      manualES: "",
      manualEN: "",
      descriptionPT: "",
      descriptionES: "",
      descriptionEN: ""
    });
  }

  saveCategory(): void{
    let category = {
      titlePT: this.categoryForm.get('titlePT')!.value,
      titleES: this.categoryForm.get('titleES')!.value,
      titleEN: this.categoryForm.get('titleEN')!.value,
      descriptionPT: this.categoryForm.get('descriptionPT')!.value,
      descriptionES: this.categoryForm.get('descriptionES')!.value,
      descriptionEN: this.categoryForm.get('descriptionEN')!.value,
      manualPT: this.categoryForm.get('manualPT')!.value,
      manualES: this.categoryForm.get('manualES')!.value,
      manualEN: this.categoryForm.get('manualEN')!.value
    };

    if(this.selectedCategoryIndex >= 0)
    {
      this.activeJam!.categories[this.selectedCategoryIndex] = category;
    }
    else
    {
      this.activeJam?.categories.push(category);
    }

    this.clearCategoryForm();
  }

  deleteCategory(index: number)
  {
    let category = this.activeJam!.categories[index];
    this.message.showDialog(
      "Confirm Action",
      `Delete category with title ${category.titlePT}?`, () => {
        if(index >= 0 && index < this.activeJam!.categories.length)
        {
          this.activeJam?.categories.splice(index, 1);
        }
      });
  }

// #endregion

// #region Stages Functions
  patchStageForm(index: number): void {
    this.selectedStageIndex = index;
    if(index >= 0 && index < this.activeJam!.stages.length)
    {
      let stage = this.activeJam!.stages[index];

      // Calculate the current timezone offset and remove the BRT offset
      let now = new Date();
      let tzOffset = (now.getTimezoneOffset() - 180) * 60000;

      // Remove the BRT offset
      let startDate = new Date(stage.startDate);
      startDate = new Date(startDate.getTime() + tzOffset);

      let endDate = new Date(stage.endDate);
      endDate = new Date(endDate.getTime() + tzOffset);

      //let startDate = stage.startDate ? formatDate(stage.startDate, 'yyyy-MM-dd', 'en', this.timeZone) : null;
      //let endDate = stage.endDate ? formatDate(stage.endDate, 'yyyy-MM-dd', 'en', this.timeZone) : null;

      this.stageForm.setValue({
        stageName: stage.stageName,
        startDate: formatDate(startDate, 'yyyy-MM-dd', 'en'),
        endDate: formatDate(endDate, 'yyyy-MM-dd', 'en'),
        roleGlobal: stage.roles.some(r => r.roleName === "GlobalOrganizer"),
        roleLocal: stage.roles.some(r => r.roleName === "LocalOrganizer"),
        roleJudge: stage.roles.some(r => r.roleName === "Judge"),
        roleJammer: stage.roles.some(r => r.roleName === "Jammer")
      });

      console.log(stage.roles);
    }
    else
    {
      this.clearStageForm();
    }
  }

  formatDate(date: Date){
    date = new Date(date);

    let now = new Date();
    let tzOffset = (now.getTimezoneOffset() - 180) * 60000;

    // Remove the BRT offset
    date = new Date(date.getTime() + tzOffset);

    return formatDate(date, 'yyyy-MM-dd', 'en');
  }

  clearStageForm(): void {
    this.stageForm.setValue({
      stageName: '',
      startDate: new Date(),
      endDate: new Date(),
      roleGlobal: false,
      roleLocal: false,
      roleJudge: false,
      roleJammer: false
    })
  }

  saveStage(): void{
    if(!this.stageForm.valid)
    {
      this.errorMessage = "Please fill the Stage Name and Dates";
      return;
    }
    let roles = [];

    if(this.stageForm.get('roleGlobal')!.value) roles.push({roleName: "GlobalOrganizer"});
    if(this.stageForm.get('roleLocal')!.value) roles.push({roleName: "LocalOrganizer"});
    if(this.stageForm.get('roleJudge')!.value) roles.push({roleName: "Judge"});
    if(this.stageForm.get('roleJammer')!.value) roles.push({roleName: "Jammer"});

    const startDate = moment.tz(`${this.stageForm.get('startDate')!.value} 00:00:00`, `YYYY-MM-DD HH:mm:ss`, `America/Sao_Paulo`).toDate();
    const endDate = moment.tz(`${this.stageForm.get('endDate')!.value} 23:59:59`, `YYYY-MM-DD HH:mm:ss`, `America/Sao_Paulo`).toDate();
    const delta = endDate.getTime() - startDate.getTime();

    if(delta < 0)
    {
      this.errorMessage = "Start Date must be before End Date";
      return;
    }

    console.log(this.stageForm.get('endDate')!.value);
    console.log(`Start Date is: ${startDate} End Date is: ${endDate} Delta is ${endDate.getTime() - startDate.getTime()}`);

    let stage = {
      stageName: this.stageForm.get('stageName')!.value,
      startDate: startDate,
      endDate: endDate,
      roles: roles
    }

    if(this.selectedStageIndex >= 0)
    {
      this.activeJam!.stages[this.selectedStageIndex] = stage;
    }
    else
    {
      this.activeJam!.stages.push(stage);
    }

    this.activeJam!.stages.sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    this.selectedStageIndex = -1;
    this.clearStageForm();
    this.closeStageModal?.nativeElement.click();
  }

  deleteStage(index: number): void {
    let stage = this.activeJam!.stages[index];
    this.message.showDialog(
      "Confirm Action",
      `Delete Stage with name ${stage.stageName}?`, () => {
        if(index >= 0 && index < this.activeJam!.stages.length)
        {
          this.activeJam?.stages.splice(index, 1);
        }
      });
  }
// #endregion

// #region SiteView functions
  selectSite(site: any) {
    this.selectedSite = site;
    this.listJammersOfSite(site);
    // Reset modal state before opening
    const modalElement = document.getElementById('siteInfoModal');
    if (modalElement) {
      modalElement.classList.remove('show');
      modalElement.style.display = 'none';
      document.body.classList.remove('modal-open');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    }
    // Small delay to ensure clean state
    setTimeout(() => {
      if (modalElement) {
        modalElement.classList.add('show');
        modalElement.style.display = 'block';
        document.body.classList.add('modal-open');
      }
    }, 50);
  }

  clearSite()
  {
    this.selectedSite = null;
    this.selectedJammers = [];
  }

  listJammersOfSite(site: any) : void
  {
    if(site && this.activeJam)
    {
      const url = `${environment.apiUrl}/api/user/get-jammers-per-site/${site._id}/${this.activeJam._id}`;
      this.userService.getJammersPerSite(url).subscribe({
        next: (jammers: User[]) => {
          this.selectedJammers = jammers;
          this.selectedJammers.sort((a,b) =>{
            if(!a.team && b.team) return -1;
            if(a.team && !b.team) return 1;
            if(a.team && b.team)
            {
              if(a.team.name.toLowerCase() < b.team.name.toLowerCase()) return -1;
              if(a.team.name.toLowerCase() > b.team.name.toLowerCase()) return 1;
            }
            if(a.name.toLowerCase() < b.name.toLowerCase()) return -1;
            if(a.name.toLowerCase() > b.name.toLowerCase()) return 1;
            return 0;
          });

          let lastTeamName = '';
          let colors = ['', 'table-secondary'];
          let colorIndex = 0;
          let teamCount = 0;
          for(let j = 0; j < jammers.length; ++j)
          {
            if(jammers[j].team)
            {
              if(jammers[j].team!.name != lastTeamName)
              {
                lastTeamName = jammers[j].team!.name;
                this.teamColors[lastTeamName] = colors[colorIndex];
                colorIndex = colorIndex == 0 ? 1 : 0;
                ++teamCount;
              }
            }
          }
          console.log(this.teamColors);
        },
        error: (error) => {
          console.log(error);
        }
      });
    }

  }

  getJammerRowColor(jammer: User)
  {
    if(jammer.team)
    {
      return this.teamColors[jammer.team.name];
    }
    else
    {
      return 'table-warning';
    }
  }

  utcIsoToLocalInputValue(utcIso: string): string {
    if (!utcIso) return '';

    const d = new Date(utcIso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());

    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }
// #endregion
}
