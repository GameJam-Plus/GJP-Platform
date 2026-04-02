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
import { faPencil } from '@fortawesome/free-solid-svg-icons';
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
  faPencil = faPencil;
  notificationLanguage: NotificationLanguage = 'EN';
  notificationDraft: Omit<NotificationPayload, 'createdAt' | 'expiresAt'> = {
    titlePT: '',
    titleES: '',
    titleEN: '',
    descriptionPT: '',
    descriptionES: '',
    descriptionEN: ''
  };
  notificationExpirationDate: string = '';
  notificationExpirationTime: string = '';
  editingNotificationId: string = '';
  notificationEditDraft: Omit<NotificationPayload, '_id' | 'createdAt' | 'readBy' | 'expiresAt'> = {
    titlePT: '',
    titleES: '',
    titleEN: '',
    descriptionPT: '',
    descriptionES: '',
    descriptionEN: ''
  };
  notificationEditExpirationDate: string = '';
  notificationEditExpirationTime: string = '';
  notifications: NotificationPayload[] = [];
  unreadNotificationsCount: number = 0;
  private notificationsRefreshIntervalId?: ReturnType<typeof setInterval>;
  private expirationRefreshTimeoutId?: ReturnType<typeof setTimeout>;
  private lastMarkAllAsReadTime: number = 0;

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
    this.startNotificationsAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.notificationsRefreshIntervalId) {
      clearInterval(this.notificationsRefreshIntervalId);
      this.notificationsRefreshIntervalId = undefined;
    }

    if (this.expirationRefreshTimeoutId) {
      clearTimeout(this.expirationRefreshTimeoutId);
      this.expirationRefreshTimeoutId = undefined;
    }
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
      descriptionEN: this.notificationDraft.descriptionEN.trim(),
      expiresAt: ''
    };

    if (!payload.titlePT && !payload.titleES && !payload.titleEN) {
      this.errorMessage = 'At least one title is required.';
      return;
    }

    if (!this.notificationExpirationDate || !this.notificationExpirationTime) {
      this.errorMessage = 'Please select expiration date and time.';
      return;
    }

    const expiresAt = new Date(`${this.notificationExpirationDate}T${this.notificationExpirationTime}`);
    if (Number.isNaN(expiresAt.getTime())) {
      this.errorMessage = 'Invalid expiration date/time.';
      return;
    }

    if (expiresAt.getTime() <= Date.now()) {
      this.errorMessage = 'Expiration date/time must be in the future.';
      return;
    }

    payload.expiresAt = expiresAt.toISOString();
    this.errorMessage = '';

    this.notificationService.createNotification(payload).subscribe({
      next: () => {
        window.location.reload();
      },
      error: () => {
        this.errorMessage = 'Could not save notification.';
      }
    });
  }

  private loadNotifications(options?: { preserveExistingOnEmpty?: boolean }): void {
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        const fetchedNotifications = notifications || [];
        const shouldPreserveExisting = !!options?.preserveExistingOnEmpty
          && fetchedNotifications.length === 0
          && this.notifications.length > 0;

        if (!shouldPreserveExisting) {
          this.notifications = fetchedNotifications;
        }

        this.removeExpiredNotificationsLocally();
        this.updateUnreadNotificationsCount();
        this.scheduleRefreshAtNextExpiration();
      },
      error: () => {
        // Keep current list to avoid modal flicker/empty state on transient errors.
        this.scheduleRefreshAtNextExpiration();
      }
    });
  }

  private startNotificationsAutoRefresh(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.notificationsRefreshIntervalId) {
      clearInterval(this.notificationsRefreshIntervalId);
    }

    this.notificationsRefreshIntervalId = setInterval(() => {
      // Avoid reloading if we just marked as read (give 5s grace period).
      if (Date.now() - this.lastMarkAllAsReadTime < 5000) {
        return;
      }

      this.removeExpiredNotificationsLocally();
      this.loadNotifications();
    }, 10000);
  }

  private scheduleRefreshAtNextExpiration(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.expirationRefreshTimeoutId) {
      clearTimeout(this.expirationRefreshTimeoutId);
      this.expirationRefreshTimeoutId = undefined;
    }

    const now = Date.now();
    const futureExpirations = this.notifications
      .map((notification) => new Date(notification.expiresAt || '').getTime())
      .filter((time) => !Number.isNaN(time) && time > now);

    if (futureExpirations.length === 0) {
      return;
    }

    const nextExpiration = Math.min(...futureExpirations);
    const refreshDelay = Math.max(nextExpiration - now + 1000, 1000);

    this.expirationRefreshTimeoutId = setTimeout(() => {
      this.removeExpiredNotificationsLocally();
      this.loadNotifications();
    }, refreshDelay);
  }

  private removeExpiredNotificationsLocally(): void {
    const now = Date.now();
    const activeNotifications = this.notifications.filter((notification) => {
      const expirationTime = new Date(notification.expiresAt || '').getTime();
      if (Number.isNaN(expirationTime)) {
        return true;
      }

      return expirationTime > now;
    });

    if (activeNotifications.length !== this.notifications.length) {
      this.notifications = activeNotifications;
      this.updateUnreadNotificationsCount();
      this.scheduleRefreshAtNextExpiration();
    }
  }

  removeNotification(notificationId?: string): void {
    if (!notificationId) {
      return;
    }

    this.notificationService.deleteNotification(notificationId).subscribe({
      next: () => {
        this.notifications = this.notifications.filter((notification) => notification._id !== notificationId);
        this.updateUnreadNotificationsCount();
        this.scheduleRefreshAtNextExpiration();
      },
      error: () => {
        this.errorMessage = 'Could not remove notification.';
      }
    });
  }

  openEditNotification(notification: NotificationPayload): void {
    if (!notification || !notification._id) {
      return;
    }

    this.editingNotificationId = notification._id;
    this.notificationEditDraft = {
      titlePT: String(notification.titlePT || ''),
      titleES: String(notification.titleES || ''),
      titleEN: String(notification.titleEN || ''),
      descriptionPT: String(notification.descriptionPT || ''),
      descriptionES: String(notification.descriptionES || ''),
      descriptionEN: String(notification.descriptionEN || '')
    };

    const expiresAt = notification.expiresAt ? new Date(notification.expiresAt) : null;
    if (expiresAt && !Number.isNaN(expiresAt.getTime())) {
      this.notificationEditExpirationDate = this.formatDateForInput(expiresAt);
      this.notificationEditExpirationTime = this.formatTimeForInput(expiresAt);
    } else {
      this.notificationEditExpirationDate = '';
      this.notificationEditExpirationTime = '';
    }
  }

  saveEditedNotification(): void {
    if (!this.editingNotificationId) {
      this.errorMessage = 'Notification not selected.';
      return;
    }

    const payload: NotificationPayload = {
      titlePT: this.notificationEditDraft.titlePT.trim(),
      titleES: this.notificationEditDraft.titleES.trim(),
      titleEN: this.notificationEditDraft.titleEN.trim(),
      descriptionPT: this.notificationEditDraft.descriptionPT.trim(),
      descriptionES: this.notificationEditDraft.descriptionES.trim(),
      descriptionEN: this.notificationEditDraft.descriptionEN.trim(),
      expiresAt: ''
    };

    if (!payload.titlePT && !payload.titleES && !payload.titleEN) {
      this.errorMessage = 'At least one title is required.';
      return;
    }

    if (!this.notificationEditExpirationDate || !this.notificationEditExpirationTime) {
      this.errorMessage = 'Please select expiration date and time.';
      return;
    }

    const expiresAt = new Date(`${this.notificationEditExpirationDate}T${this.notificationEditExpirationTime}`);
    if (Number.isNaN(expiresAt.getTime())) {
      this.errorMessage = 'Invalid expiration date/time.';
      return;
    }

    if (expiresAt.getTime() <= Date.now()) {
      this.errorMessage = 'Expiration date/time must be in the future.';
      return;
    }

    payload.expiresAt = expiresAt.toISOString();

    this.notificationService.updateNotification(this.editingNotificationId, payload).subscribe({
      next: () => {
        window.location.reload();
      },
      error: () => {
        this.errorMessage = 'Could not update notification.';
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
    this.notificationExpirationDate = '';
    this.notificationExpirationTime = '';
  }

  private formatDateForInput(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatTimeForInput(value: Date): string {
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private resetEditNotificationDraft(): void {
    this.editingNotificationId = '';
    this.notificationEditDraft = {
      titlePT: '',
      titleES: '',
      titleEN: '',
      descriptionPT: '',
      descriptionES: '',
      descriptionEN: ''
    };
    this.notificationEditExpirationDate = '';
    this.notificationEditExpirationTime = '';
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
    // Always force full reload from backend when opening modal to show latest data.
    this.loadNotifications({ preserveExistingOnEmpty: false });

    // Immediate visual feedback: hide unread badge as soon as modal opens.
    this.unreadNotificationsCount = 0;

    this.markAllNotificationsAsRead();
  }

  private markAllNotificationsAsRead(): void {
    const currentUserId = this.normalizeMongoId(this.user?._id);
    if (!currentUserId) {
      return;
    }

    const readMark: NonNullable<NotificationPayload['readBy']>[number] = {
      userId: currentUserId,
      readAt: new Date().toISOString()
    };

    // Optimistic update to avoid unread badge flicker while modal opens.
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

    // Update timestamp to prevent auto-refresh race condition.
    this.lastMarkAllAsReadTime = Date.now();

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.updateUnreadNotificationsCount();
      },
      error: () => {
        this.updateUnreadNotificationsCount();
      }
    });
  }

  private hasUserReadNotification(notification: NotificationPayload): boolean {
    const currentUserId = this.normalizeMongoId(this.user?._id);
    if (!currentUserId) {
      return false;
    }

    return (notification.readBy || []).some((readEntry) => {
      if (!readEntry || !readEntry.userId) {
        return false;
      }

      const readEntryUserId = this.normalizeMongoId(readEntry.userId);
      return !!readEntryUserId && readEntryUserId === currentUserId;
    });
  }

  private normalizeMongoId(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object') {
      const objectValue = value as { _id?: unknown; $oid?: unknown; toString?: () => string };

      if (objectValue._id) {
        return this.normalizeMongoId(objectValue._id);
      }

      if (objectValue.$oid && typeof objectValue.$oid === 'string') {
        return objectValue.$oid;
      }

      if (typeof objectValue.toString === 'function') {
        const parsed = objectValue.toString();
        if (parsed && parsed !== '[object Object]') {
          return parsed;
        }
      }

      return null;
    }

    return String(value);
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
