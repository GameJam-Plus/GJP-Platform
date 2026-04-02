import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef  } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, FormArray } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { GameJam, Region, Site, Country, Team, User } from '../../../types';
import { TeamService } from '../../services/team.service';
import { UserService } from '../../services/user.service';
import { RegionService } from '../../services/region.service';
import { SiteService } from '../../services/site.service';
import { GamejamService } from '../../services/gamejam.service';
import { MessagesComponent } from '../../messages/messages.component';
import { jsPDF }  from 'jspdf';
import autoTable from 'jspdf-autotable';
import { environment } from '../../../environments/environment.prod';

@Component({
  selector: 'app-team-crud',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MessagesComponent
  ],
  templateUrl: './team-crud.component.html',
  styleUrl: './team-crud.component.css'
})
export class TeamCrudComponent implements OnInit {
  teamForm!: FormGroup;
  selectedHeader: string | undefined;
  columnOptions = [
    { label: 'Name', value: 'teamName' as keyof Team, checked: false },
    { label: 'Region', value: 'regionId' as keyof Team, checked: false },
    { label: 'Site', value: 'siteId' as keyof Team, checked: false },
    { label: 'Country', value: 'country.name' as keyof Team, checked: false },
  ];
  selectedColumns: (keyof Team)[] = [];
  filterValue: string = '';

  teams: Team[] = [];
  sites: Site[] = [];
  regions: Region[] = [];
  selectedTeam: Team | null = null;
  jammers: User[] = [];

  @ViewChild(MessagesComponent) message!: MessagesComponent;
  @ViewChild('teamModalCloseBtn') teamModalCloseBtn?: ElementRef<HTMLButtonElement>;
  constructor(private fb: FormBuilder, private teamService: TeamService, private userService: UserService, private regionService: RegionService, private siteService: SiteService, private gamejamService: GamejamService){
  }
  // TODO REBUILD TEAMS CRUD
  ngOnInit(): void {
    this.listRegions();
    this.listSites();
    this.listTeams();
  }

  listTeams(){
    this.teamService.getTeams(`${environment.apiUrl}/api/team/get-teams`).subscribe({
      next: (teams) => {
        this.teams = teams;
        console.log(this.teams);
      },
      error: (error) => {
        console.error('Error listing Teams:', error);
      }
    });
  }

  listSites(){
    this.siteService.getSites(`${environment.apiUrl}/api/site/get-sites`).subscribe({
      next: (sites) => {
        this.sites = sites;
      },
      error: (error) => {
        console.error('Error getting venues:', error);
      }
    });
  }

  listRegions(){
    this.regionService.getRegions(`${environment.apiUrl}/api/region/get-regions`).subscribe({
      next: (regions) => {
        this.regions = regions;
      },
      error: (error) => {
        console.error('Error getting regions:', error);
      }
    });
  }

  getRows() : Team[] {
    return this.teams;
  }

  getRegionName(siteId: string) : string {
    const site = this.sites.find(site => site._id === siteId);
    const region = this.regions.find(region => region._id === site?.regionId)
    if(region) return region.name;
    else return 'None';
  }

  getSiteName(siteId: string) : string {
    const site = this.sites.find(site => site._id === siteId);
    if(site) return site.name;
    else return 'None';
  }

  getCountryName(siteId: string) : string {
    const site = this.sites.find(site => site._id === siteId);
    if(site) return site.country.name;
    else return 'None';
  }

  selectTeam(team: Team){
    this.selectedTeam = team;
    this.getJammersPerTeam(team._id!);
  }

  getJammersPerTeam(teamId: string){
    const url = `${environment.apiUrl}/api/team/get-current-team-users/${teamId}`;
    this.teamService.getJammersPerTeam(url).subscribe({
      next: (jammers) => {
        this.jammers = jammers;
      },
      error: (error) => {
        console.error('Error getting jammers:', error);
      }
    });
  }

  saveTeam(){}

  addTeam(){}

  editTeam(){}

  deleteTeam(team: Team){}

  promoteJammerToLeader(jammer: User) {
    const url = `${environment.apiUrl}/api/team/update-team-owner/${this.selectedTeam?._id}/${jammer._id}`;
    this.teamService.updateTeamOwner(url).subscribe({
      next: (data) => {
        this.updateTeamJammers(jammer, 'promote');
        this.message.showMessage("Success", data.message);
      },
      error: (error) => {
        this.message.showMessage("Error", error.error.message);
      }
    });
  }

  removeJammerFromTeam(jammer: User) {
    const teamId = this.selectedTeam?._id;
    if (!teamId) return;

    const url = `${environment.apiUrl}/api/team/remove-jammer/${this.selectedTeam?._id}/${jammer._id}`
    this.teamService.removeJammerFromTeam(url).subscribe({
      next: (data) => {
        if (!data.team) {
          this.teams = this.teams.filter(t => t._id !== teamId);
          this.selectedTeam = null;
          this.jammers = [];
          this.teamModalCloseBtn?.nativeElement?.click();
          this.message.showMessage("Success", data.message);
          return;
        }
        else {
          this.updateTeamJammers(jammer, 'remove');
        }
        this.message.showMessage("Success", data.message);
      },
      error: (error) => {
        this.message.showMessage("Error", error.error.message);
      }
    });
  }

  private updateTeamJammers(jammer: User, action: 'promote' | 'remove') {
    if (action === 'remove') {
      this.jammers = this.jammers.filter(j => j._id !== jammer._id);

      // Keep the main teams table in sync (row.jammers.length)
      if (this.selectedTeam?.jammers) {
        this.selectedTeam.jammers = this.selectedTeam.jammers.filter(j => j._id !== jammer._id) as any;
      }
      return;
    }
  
    if (action === 'promote') {
      this.jammers = this.jammers.map(j => ({
        ...j,
        role: j._id === jammer._id ? 'owner' : ''
      }));

      if (this.selectedTeam?.jammers) {
        this.selectedTeam.jammers = this.selectedTeam.jammers.map(j => ({
          ...j,
          role: j._id === jammer._id ? 'owner' : ''
        })) as any;
      }
    }
  }

  toggleColumn(column: keyof Team, event: any) {
    if (event.target.checked) {
      this.selectedColumns.push(column);
    } else {
      this.selectedColumns = this.selectedColumns.filter(c => c !== column);
    }
  }

  exportToPDF(){

  }
}
