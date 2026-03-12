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
import { faBell } from '@fortawesome/free-solid-svg-icons'; // Se começar a ter muitos icones, deixar na mesma linha
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { environment } from '../../environments/environment.prod';
import { NotificationService, NotificationPayload } from '../services/notification.service';

type NotificationLanguage = 'PT' | 'ES' | 'EN';

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
  faBell = faBell;
  faPlus = faPlus;
  notificationLanguage: NotificationLanguage = 'EN';
  notificationDraft: Omit<NotificationPayload, 'createdAt'> = {
    titlePT: '',
    titleES: '',
    titleEN: '',
    descriptionPT: '',
    descriptionES: '',
    descriptionEN: ''
  };
  notifications: NotificationPayload[] = [];
  unreadNotificationsCount: number = 0;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private siteService: SiteService,
    private regionService: RegionService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.notificationLanguage = this.resolveNotificationLanguage();

    this.userForm = this.fb.group({
      name: ['', Validators.required],
      discordUsername: ['', Validators.required],
      telefoneWhatsApp: [''],
      instagram: [''],
      linkedin: [''],
      ethnicity: [''],
      gender: [''],
      intersex: [''],
      identity: [''],
      orientation: [''],
      disability: [''],
      participation: [''],
      student: [''],
      school: ['']
    });

    this.getUser();
    this.loadNotifications();
  }

  private resolveNotificationLanguage(): NotificationLanguage {
    const language = (typeof navigator !== 'undefined' ? navigator.language : 'en').toLowerCase();
    if (language.startsWith('pt')) {
      return 'PT';
    }
    if (language.startsWith('es')) {
      return 'ES';
    }
    return 'EN';
  }

  saveNotification(): void {
    const payload: Omit<NotificationPayload, 'createdAt'> = {
      titlePT: this.notificationDraft.titlePT.trim(),
      titleES: this.notificationDraft.titleES.trim(),
      titleEN: this.notificationDraft.titleEN.trim(),
      descriptionPT: this.notificationDraft.descriptionPT.trim(),
      descriptionES: this.notificationDraft.descriptionES.trim(),
      descriptionEN: this.notificationDraft.descriptionEN.trim()
    };

    if (!payload.titlePT && !payload.titleES && !payload.titleEN) {
      return;
    }

    this.notificationService.createNotification(payload).subscribe({
      next: (notification) => {
        this.notifications.unshift(notification);
        this.resetNotificationDraft();
        this.updateUnreadNotificationsCount();
      },
      error: () => {
        this.errorMessage = 'Could not save notification.';
      }
    });
  }

  private loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications || [];
        this.updateUnreadNotificationsCount();
      },
      error: () => {
        this.notifications = [];
      }
    });
  }

  removeNotification(notificationId?: string): void {
    if (!notificationId) {
      return;
    }

    this.notificationService.deleteNotification(notificationId).subscribe({
      next: () => {
        this.notifications = this.notifications.filter((notification) => notification._id !== notificationId);
        this.updateUnreadNotificationsCount();
      },
      error: () => {
        this.errorMessage = 'Could not remove notification.';
      }
    });
  }

  private resetNotificationDraft(): void {
    this.notificationDraft = {
      titlePT: '',
      titleES: '',
      titleEN: '',
      descriptionPT: '',
      descriptionES: '',
      descriptionEN: ''
    };
  }

  getNotificationTitle(notification: NotificationPayload): string {
    if (this.notificationLanguage === 'PT') {
      return notification.titlePT || notification.titleEN || notification.titleES;
    }
    if (this.notificationLanguage === 'ES') {
      return notification.titleES || notification.titleEN || notification.titlePT;
    }
    return notification.titleEN || notification.titlePT || notification.titleES;
  }

  getNotificationDescription(notification: NotificationPayload): string {
    if (this.notificationLanguage === 'PT') {
      return notification.descriptionPT || notification.descriptionEN || notification.descriptionES;
    }
    if (this.notificationLanguage === 'ES') {
      return notification.descriptionES || notification.descriptionEN || notification.descriptionPT;
    }
    return notification.descriptionEN || notification.descriptionPT || notification.descriptionES;
  }

  onOpenNotifications(): void {
    this.markAllNotificationsAsRead();
  }

  private markAllNotificationsAsRead(): void {
    const currentUserId = this.user?._id;
    if (!currentUserId) {
      return;
    }

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        const readMark: NonNullable<NotificationPayload['readBy']>[number] = {
          userId: currentUserId,
          readAt: new Date().toISOString()
        };
        this.notifications = this.notifications.map((notification) => {
          const alreadyRead = this.hasUserReadNotification(notification);
          if (alreadyRead) {
            return notification;
          }
          return {
            ...notification,
            readBy: [...(notification.readBy || []), readMark]
          };
        });
        this.updateUnreadNotificationsCount();
      }
    });
  }

  private hasUserReadNotification(notification: NotificationPayload): boolean {
    if (!this.user || !this.user._id) {
      return false;
    }

    return (notification.readBy || []).some((readEntry) => {
      if (!readEntry || !readEntry.userId) {
        return false;
      }

      if (typeof readEntry.userId === 'string') {
        return readEntry.userId === this.user._id;
      }

      return !!readEntry.userId._id && readEntry.userId._id === this.user._id;
    });
  }

  private updateUnreadNotificationsCount(): void {
    if (!this.user || !this.user._id) {
      this.unreadNotificationsCount = 0;
      return;
    }

    this.unreadNotificationsCount = this.notifications.filter((notification) => !this.hasUserReadNotification(notification)).length;
  }

  getUser() : void{
    this.userService.getCurrentUser(`${environment.apiUrl}/api/user/get-user`).subscribe({
      next: (user:User) =>{
        this.user = user;
        this.activeRole = user.roles[0]; // select the highest role as the active role
        this.updateUnreadNotificationsCount();

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
        discordUsername: this.user.discordUsername ? this.user.discordUsername : '',
        telefoneWhatsApp: this.user.telefoneWhatsApp ? this.user.telefoneWhatsApp : '',
        instagram: this.user.instagram ? this.user.instagram : '',
        linkedin: this.user.linkedin ? this.user.linkedin : '',
        ethnicity: this.user.ethnicity ? this.user.ethnicity : '',
        gender: this.user.gender ? this.user.gender : '',
        intersex: this.user.intersex ? this.user.intersex : '',
        identity: this.user.identity ? this.user.identity : '',
        orientation: this.user.orientation ? this.user.orientation : '',
        disability: this.user.disability ? this.user.disability : '',
        participation: this.user.participation ? this.user.participation : '',
        student: this.user.student ? this.user.student : '',
        school: this.user.school ? this.user.school : '' 
      })
    }
  }

  clearUserForm() : void {
    this.userForm.setValue({
      name: '',
      discordUsername: '',
      telefoneWhatsApp: '',
      instagram: '',
      linkedin: '',
      ethnicity: '',
      gender: '',
      intersex: '',
      identity: '',
      orientation: '',
      disability: '',
      participation: '',
      student: '',
      school: ''

    });
    this.errorMessage = '';
    this.successMessage = '';
  }

  updateUser() : void {
    if(this.user && this.userForm.valid && this.user._id)
    {
      if(!this.userForm.valid) {
        const controls = this.userForm.controls;
        for (const name in controls) {
          if (controls[name].invalid) {
            console.log(`Invalid field: ${name}`);
            console.log(`Value: ${controls[name].value}`);
            console.log(`Errors:`, controls[name].errors);
          }
        }
        this.errorMessage = "Please notify the problem.";
      }

      else {

        const formValues = this.userForm.value;

        const updateData: User = {
          name: this.userForm.get('name')?.value,
          email: this.user.email,
          discordUsername: this.userForm.get('discordUsername')?.value,
          telefoneWhatsApp: this.userForm.get('')?.value,
          ethnicity: this.userForm.get('')?.value,
          gender: this.user.gender,
          intersex: this.userForm.get('')?.value,
          identity: this.userForm.get('')?.value,
          orientation: this.userForm.get('')?.value,
          disability: this.userForm.get('')?.value,
          participation: this.userForm.get('')?.value,
          student: this.userForm.get('')?.value,
          school: this.userForm.get('')?.value,
          region: this.user.region,
          site: this.user.site,
          team: this.user.team,
          coins: this.user.coins,
          roles: this.user.roles,
        };
        
        //this.userService.updateUser(`${environment.apiUrl}/api/user/update-user/${this.user._id}`, this.user).subscribe({
        this.userService.updateUser(this.user._id, updateData).subscribe({
          next: (data) => {
            this.successMessage = "User updated successfully";
            this.getUser();
          },
          error: (error) => {
            this.errorMessage = error.message;
          }
        });
      }
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
