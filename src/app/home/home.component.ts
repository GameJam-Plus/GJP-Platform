import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { SiteService } from '../services/site.service';
import { RegionService } from '../services/region.service';
import { LocalHomeComponent } from '../local-home/local-home.component';
import { JammerHomeComponent } from '../jammer-home/jammer-home.component';
import { JuezMainComponent } from '../juez-main/juez-main.component';
import { GlobalHomeComponent } from '../global-home/global-home.component';
import { UserDashboardComponent } from '../user-dashboard/user-dashboard.component';
import { User, Site, Region } from '../../types';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleUser } from '@fortawesome/free-solid-svg-icons';
import { environment } from '../../environments/environment.prod';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LocalHomeComponent,
    JammerHomeComponent,
    JuezMainComponent,
    GlobalHomeComponent,
    UserDashboardComponent,
    FontAwesomeModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent{
  userForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  user!: User;
  site?: Site;
  region?: Region;
  name: string = '';
  activeRole: string = "";
  faCircleUser = faCircleUser;

  constructor(private fb: FormBuilder, private router: Router, private userService: UserService, private siteService: SiteService, private regionService: RegionService) {}

  ngOnInit(): void {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      discordUsername: ['']
    });

    this.getUser();
  }

  getUser() : void{
    this.userService.getCurrentUser(`${environment.apiUrl}/api/user/get-user`).subscribe({
      next: (user:User) =>{
        this.user = user;
        this.activeRole = user.roles[0]; // select the highest role as the active role

        if(user.site)
        {
          this.siteService.getSite(`${environment.apiUrl}/api/site/get-site/${user.site._id}`).subscribe({
            next : (site: Site) => { this.site = site }
          });
        }

        if(user.region)
        {
          this.regionService.getRegion(`${environment.apiUrl}/api/region/get-region/${user.region._id}`).subscribe({
            next : (region: Region) => { this.region = region }
          });
        }
      },
      error: (error) => {
        this.router.navigate(['/login']);
      }
    });
  }

  getUserRegionName(): string {
    if(this.region)
    {
      return this.region.name;
    }
    else
    {
      return "None";
    }
  }

  getUserSiteName(): string {
    if(this.site)
    {
      return this.site.name;
    }
    else
    {
      return "None";
    }
  }

  changeActiveRole(newRole: string)
  {
    this.activeRole = newRole;
  }

  patchUserForm() : void {
    if(this.user)
    {
      this.userForm.setValue({
        name: this.user.name,
        discordUsername: this.user.discordUsername ? this.user.discordUsername : ''
      })
    }
  }

  clearUserForm() : void {
    this.userForm.setValue({
      name: '',
      discordUsername: ''
    });
    this.errorMessage = '';
    this.successMessage = '';
  }

  updateUser() : void {
    if(this.user && this.userForm.valid && this.user._id)
    {
      this.user.name = this.userForm.get('name')?.value;
      this.user.discordUsername = this.userForm.get('discordUsername')?.value;
      //this.userService.updateUser(`${environment.apiUrl}/api/user/update-user/${this.user._id}`, this.user).subscribe({
      this.userService.updateUser(this.user._id, this.user).subscribe({

        next: (data) => {
          this.successMessage = "User updated successfully";
          this.getUser();
        },
        error: (error) => {
          this.errorMessage = error.message;
        }
      });
    }
    else
    {
      this.errorMessage = "Please fill all the fields";
    }
  }

  logOut(): void {
    this.userService.logOutUser(`${environment.apiUrl}/api/user/log-out-user`).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error logging out', error.error.message);
        this.router.navigate(['/login']);
      }
    });
  }
}
