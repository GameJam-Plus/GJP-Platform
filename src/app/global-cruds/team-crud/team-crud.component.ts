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

  @ViewChild(MessagesComponent) message!: MessagesComponent;
  constructor(private fb: FormBuilder, private teamService: TeamService, private userService: UserService, private regionService: RegionService, private siteService: SiteService, private gamejamService: GamejamService){
  }
  // TODO REBUILD TEAMS CRUD
  ngOnInit(): void {
    this.listRegions();
    this.listSites();
    this.listTeams();
  }

  listTeams(){
    this.teamService.getTeams(`${environment.apiUrl}:3000/api/team/get-teams`).subscribe({
      next: (teams) => {
        this.teams = teams;
      },
      error: (error) => {
        console.error('Error listing Teams:', error);
      }
    });
  }

  listSites(){
    this.siteService.getSites(`${environment.apiUrl}:3000/api/site/get-sites`).subscribe({
      next: (sites) => {
        this.sites = sites;
      },
      error: (error) => {
        console.error('Error al obtener sitios:', error);
      }
    });
  }

  listRegions(){
    this.regionService.getRegions(`${environment.apiUrl}:3000/api/region/get-regions`).subscribe({
      next: (regions) => {
        this.regions = regions;
      },
      error: (error) => {
        console.error('Error al obtener regiones:', error);
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

  selectTeam(team: Team){}

  saveTeam(){}

  addTeam(){}

  editTeam(){}

  deleteTeam(team: Team){}

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
