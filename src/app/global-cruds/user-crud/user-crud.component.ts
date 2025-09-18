import { Component, OnInit, ViewChild, ElementRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { Region, Site, User } from '../../../types';
import { SiteService } from '../../services/site.service';
import { RegionService } from '../../services/region.service';
import { MessagesComponent } from '../../messages/messages.component';
import { jsPDF }  from 'jspdf';
import autoTable from 'jspdf-autotable';
import { environment } from '../../../environments/environment.prod';
import { Observable } from 'rxjs';
import { faGenderless } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-user-crud',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MessagesComponent
  ],
  templateUrl: './user-crud.component.html',
  styleUrl: './user-crud.component.css'
})
export class UserCrudComponent implements OnInit{
  userForm!: FormGroup;
  users: User[] = [];
  filteredUsers: User[] = [];
  regions: Region[] = [];
  sites: Site[] = [];
  filteredSites: Site[] = [];
  roles = ['GlobalOrganizer', 'LocalOrganizer', 'Judge', 'Jammer', ['LocalOrganizer', 'Judge']];
  successMessage: string = '';
  errorMessage: string = '';
  userToEdit : User | null = null;
  indexUser = 0;
  selectedHeader: string | undefined;
  filterValue: string = '';
  filter: any = {};
  selectedColumns: (keyof User)[] = [];
  @ViewChild(MessagesComponent) message!: MessagesComponent;
  @ViewChild('closeUserModal') closeUserForm!: ElementRef;
  columnOptions = [
    { label: 'Name', value: 'name' as keyof User, checked: false },
    { label: 'Email', value: 'email' as keyof User, checked: false },
    { label: 'Discord', value: 'discordUsername' as keyof User, checked: false },
    { label: 'Region', value: 'region.name' as keyof User, checked: false },
    { label: 'Site', value: 'site.name' as keyof User, checked: false },
    { label: 'Team Name', value: 'team.name' as keyof User, checked: false },
    { label: 'Role', value: 'roles' as keyof User, checked: false }
  ];
  
  constructor(private fb: FormBuilder, private userService: UserService, private siteService: SiteService, private regionService: RegionService){}
  ngOnInit(): void {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', Validators.required],
      roleGlobal: [false],
      roleLocal: [false],
      roleJudge: [false],
      roleJammer: [false],
      region: [''],
      site: [''],
      discordUsername: ['']
    });

    //this.listUsers();
    this.listRegions();
    //this.listSites();
    this.pageSize = localStorage.getItem("PageSize") ? +localStorage.getItem("PageSize")! : 20;
  }

  listRegions()
  {
    this.regionService.getRegions(`${environment.apiUrl}/api/region/get-regions`).subscribe({
      next: (regions: Region[]) => {
        this.regions = regions;
        this.listSites();
      },
      error: (error) => {
        this.message.showMessage("Error", error.error.message);
      }
    });
  }

  listUsers()
  {
    const url = `${environment.apiUrl}/api/user/get-users`;
    this.userService.getUsers(url).subscribe({
      next: (users: User[]) => {
        var empty = {
          name: "None"
        };
        this.users = users;
        this.getRows();
      },
      error: (error) => {
        console.log(error.error);
      }
    });
  }

  listSites()
  {
    this.siteService.getSites(`${environment.apiUrl}/api/site/get-sites`).subscribe({
      next: (sites: Site[]) => {
        this.sites = sites;
        console.log(`Sites are ready ${this.sites.length}`);
        this.listUsers();
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  listSitesByRegion(regionId: string, siteId: string | undefined)
  {
    console.log(`Filtering Sites by regionID ${regionId} from ${this.sites.length} sites`);
    if(this.sites.length > 0)
    {
      this.filteredSites = this.sites.filter((site) => site.regionId == regionId);
      console.log(this.filteredSites);

      if(siteId && siteId != "None")
      {
        console.log(siteId);
        const selectedSite = this.filteredSites.find(site => site._id == siteId);
        if (selectedSite) {
          this.userForm.patchValue({site: selectedSite});
        }
      }
      else
      {
        this.userForm.patchValue({site: null});
      }
    }
  }

  onRegionSelection() {
    const region = this.userForm.get('region')?.value;
    if (region && region._id) {
      this.listSitesByRegion(region._id, "None");
    } else {
      this.filteredSites = [];
      console.error('La región seleccionada no tiene un ID válido.');
    }
  }

  patchUserForm(user: User)
  {
    this.userToEdit = user;
    const roleGlobal = user.roles.includes("GlobalOrganizer");
    const roleLocal = user.roles.includes("LocalOrganizer");
    const roleJudge = user.roles.includes("Judge");
    const roleJammer = user.roles.includes("Jammer");

    this.userForm.setValue({
      name: user.name,
      email: user.email,
      roleGlobal: roleGlobal,
      roleLocal: roleLocal,
      roleJudge: roleJudge,
      roleJammer: roleJammer,
      region: null,
      site: null,
      discordUsername: user.discordUsername ? user.discordUsername : '',
    });

    if(user.region)
    {
      const selectedRegion = this.regions.find(region => region._id === user.region?._id);
      this.userForm.patchValue({region: selectedRegion});
    }

    if(user.region)
    {
      this.listSitesByRegion(user.region._id, user.site?._id);
    }
  }

  clearUserForm()
  {
    this.userForm.setValue({
      name: '',
      email: '',
      roleGlobal: false,
      roleLocal: false,
      roleJudge: false,
      roleJammer: false,
      region: null,
      site: null,
      discordUsername: ''
    });
    this.filteredSites = [];
    this.errorMessage = '';
  }

  deleteUser(user: User) {
    this.message.showDialog(
      "Confirm Action",
      `Delete user with email ${user.email}?`,
      ()=>{
        const id = user._id;
        const url = `${environment.apiUrl}/api/user/delete-user/${id}`;
        this.userService.deleteUser(url).subscribe({
            next: (data) => {
                //this.users = this.users.filter(item => item !== user);
                this.listUsers();
                this.message.showMessage("Success", data.message);
            },
            error: (error) => {
                console.error('Error al eliminar el usuario:', error);
                this.message.showMessage("Error", error.error.message);
            }
        });
      },
      ()=>{});
  }

  saveUser()
  {
    if(this.userToEdit)
    {
      this.editUser();
    }
    else
    {
      this.addUser();
    }
  }

  addUser()
  {
    if(this.userForm.valid)
    {
      let region: any = null;
      if(this.userForm.get('region')?.value)
      {
        region = {
          _id: this.userForm.get('region')?.value._id,
          name: this.userForm.get('region')?.value.name
        };
      }

      let site: any = null
      if(this.userForm.get('site')?.value)
      {
        site = {
          _id: this.userForm.get('site')?.value._id,
          name: this.userForm.get('site')?.value.name
        };
      }

      let roles = [];
      if(this.userForm.get('roleGlobal')!.value) roles.push("GlobalOrganizer");
      if(this.userForm.get('roleLocal')!.value) roles.push("LocalOrganizer");
      if(this.userForm.get('roleJudge')!.value) roles.push("Judge");
      if(this.userForm.get('roleJammer')!.value) roles.push("Jammer");

      console.log(roles);
      if(roles.length == 0)
      {
        this.errorMessage = "Please select at least one role for this user";
        return;
      }

      const user: User = {
        name : this.userForm.get('name')!.value,
        email: this.userForm.get('email')!.value.toLowerCase(),
        roles: roles,
        coins: 0,
        region: region,
        site: site,
        discordUsername: this.userForm.get('discordUsername')?.value,
        instagram: this.userForm.get('instagram')?.value ?? ' ',
        linkedin: this.userForm.get('linkedin')?.value,
        telefoneWhatsApp: this.userForm.get('telefoneWhatsApp')?.value,
        //diploma: this.userForm.get('diploma')?.value,
        ethnicity: this.userForm.get('ethnicity')?.value ?? ' ',
        gender: this.userForm.get('gender')?.value ?? 'Prefer not to declare',
        intersex: this.userForm.get('intersex')?.value ?? ' ',
        genderIdentity: this.userForm.get('genderIdentity')?.value ?? ' ',
        sexualOrientation: this.userForm.get('sexualOrientation')?.value ?? ' ',
        disability: this.userForm.get('disability')?.value ?? ' ', 
        participation: this.userForm.get('participation')?.value ?? ' ', 
        student: this.userForm.get('student')?.value ?? ' ',         
        nameStuding: this.userForm.get('nameStuding')?.value ?? ' '
      };

      console.log('Adding user: ');
      console.log(user);

      this.userService.registerUser(user).subscribe({
        next: (data) => {
          if(data.success)
          {
            this.closeUserForm.nativeElement.click();
            this.message.showMessage("Success", data.message);
            this.listUsers();
          }
          else
          {
            this.errorMessage = data.message;
          }
        },
        error: (error) => {
          this.errorMessage = error.error.message;
        }
      })

      console.log(user);
    }
    else
    {
      this.errorMessage = "Please fill all the fields";
    }
  }

  editUser()
  {
    if(this.userToEdit)
    {
      let region: any = null;
      if(this.userForm.get('region')?.value)
      {
        region = {
          _id: this.userForm.get('region')?.value._id,
          name: this.userForm.get('region')?.value.name
        };
      }

      let site: any = null
      if(this.userForm.get('site')?.value)
      {
        site = {
          _id: this.userForm.get('site')?.value._id,
          name: this.userForm.get('site')?.value.name
        };
      }

      let roles = [];
      if(this.userForm.get('roleGlobal')!.value) roles.push("GlobalOrganizer");
      if(this.userForm.get('roleLocal')!.value) roles.push("LocalOrganizer");
      if(this.userForm.get('roleJudge')!.value) roles.push("Judge");
      if(this.userForm.get('roleJammer')!.value) roles.push("Jammer");

      if(roles.length == 0)
      {
        this.errorMessage = "Please select at least one role for this user";
        return;
      }

      const updateData = {
        name: this.userForm.get('name')!.value,
        email: this.userForm.get('email')!.value,
        roles: roles,
        coins: this.userToEdit.coins,
        region: region,
        site: site,
        discordUsername: this.userForm.get('discordUsername')?.value,
        instagram: this.userForm.get('instagram')?.value ?? ' ',
        linkedin: this.userForm.get('linkedin')?.value,
        telefoneWhatsApp: this.userForm.get('telefoneWhatsApp')?.value,
        //diploma: this.userForm.get('diploma')?.value,
        ethnicity: this.userForm.get('ethnicity')?.value ?? ' ',
        gender: this.userForm.get('gender')?.value ?? 'Prefer not to declare',
        intersex: this.userForm.get('intersex')?.value ?? ' ',
        genderIdentity: this.userForm.get('genderIdentity')?.value ?? ' ',
        sexualOrientation: this.userForm.get('sexualOrientation')?.value ?? ' ',
        disability: this.userForm.get('disability')?.value ?? ' ', 
        participation: this.userForm.get('participation')?.value ?? ' ', 
        student: this.userForm.get('student')?.value ?? ' ',         
        nameStuding: this.userForm.get('nameStuding')?.value ?? ' ' 
      };

      console.log('Editing user: ');
      console.log(updateData);

      this.userService.updateUser(this.userToEdit._id!, updateData).subscribe({
        next: (data) => {
          this.closeUserForm.nativeElement.click();
          this.message.showMessage("Success", "User updated successfully");
          this.listUsers();
        },
        error: (error) => {
          this.errorMessage = error.message;
        }
      });
    }

    this.userToEdit = null;
  }

  get totalPaginas(): number {
    return Math.ceil(this.users.length / this.pageSize);
  }

  pageSize = 5; // Número de elementos por página
  currentPage = 1; // Página actual

  // Función para cambiar de página
  changePage(page: number) {
    this.currentPage = page;
    this.getRows();
  }

  changePageSize(e: any)
  {
    this.pageSize = e.srcElement.value;
    this.changePage(1);
    localStorage.setItem("PageSize", `${this.pageSize}`);
  }

  setFilter(filterType: string, value: any)
  {
    switch(filterType)
    {
      case 'name':
        this.filter.name = value;
        break;
      case 'discord':
        this.filter.discordUsername = value;
        break;
      case 'email':
        this.filter.email = value;
        break;
      case 'role':
        let roles = new Array();
        for(var r = 0; r < value.length; ++r)
        {
          roles.push(value[r].value);
        }
        this.filter.roles = roles;
        break;
      case 'region':
        let regions = new Array();
        for(var r = 0; r < value.length; ++r)
        {
          regions.push(value[r].value);
        }
        this.filter.regions = regions;
        break;
      case 'site':
        let sites = new Array();
        for(var s = 0; s < value.length; ++s)
        {
          sites.push(value[s].value);
        }
        this.filter.sites = sites;
        break;
    }
    this.getRows();
  }

  clearFilters(filterName: any, filterDiscord: any, filterEmail: any, filterRole: any, filterRegion: any, filterSite: any)
  {
    filterName.value = '';
    filterDiscord.value = '';
    filterEmail.value = '';
    filterRole.selectedIndex = -1;
    filterRegion.selectedIndex = -1;
    filterSite.selectedIndex = -1;
    this.filter = {};
    this.getRows();
  }

  // Función para obtener los datos de la página actual
  getRows() {
    let filteredData = this.users;
    filteredData = filteredData.filter(item => {
        let valid = true;

        if(this.filter.name)
          valid = valid && item.name.toLowerCase().includes(this.filter.name.toLowerCase());
        if(this.filter.discordUsername)
          valid = valid && (item.discordUsername ? item.discordUsername.toLowerCase().includes(this.filter.discordUsername.toLowerCase()) : false);
        if(this.filter.email)
          valid = valid && item.email.toLowerCase().includes(this.filter.email.toLowerCase());
        if(this.filter.roles && this.filter.roles.length > 0)
        {
          let validRole = false;
          this.filter.roles.forEach((role: string) => {
            validRole = validRole || item.roles.includes(role);
          });
          valid = valid && validRole;
        }
        if(this.filter.regions && this.filter.regions.length > 0)
          valid = valid && (item.region ? this.filter.regions.includes(item.region._id) : false);
        if(this.filter.sites && this.filter.sites.length > 0)
          valid = valid && (item.site ? this.filter.sites.includes(item.site._id) : false);
        return valid;
    });
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.filteredUsers = filteredData.slice(startIndex, startIndex + this.pageSize);
  }

  getPropertyValue(obj: any, key: string) {
    if (!obj || !key) return '';
    const keys = key.split('.');
    let value = obj;
    for (const k of keys) {
        if (Array.isArray(value)) {
            value = value.map((item: any) => item[k]);
        } else {
            value = value[k];
        }
        if (value === undefined || value === null) return '';
    }
    return Array.isArray(value) ? value.join(', ') : value;
  }
  toggleColumn(column: keyof User, event: any) {
    if (event.target.checked) {
      this.selectedColumns.push(column);
    } else {
      this.selectedColumns = this.selectedColumns.filter(c => c !== column);
    }
  }

  exportToPDF() {
    /*
    const doc = new jsPDF();

    const url = `${environment.apiUrl}/api/user/get-users`;
    this.userService.getUsers(url).subscribe(
        (users: User[]) => {
            const data = users.map(user => ({
                _id: user._id || '',
                name: user.name || '',
                email: user.email || '',
                discordUsername: user.discordUsername || '',
                region: {
                    _id: user.region._id || '',
                    name: user.region.name || ''
                },
                site: {
                    _id: user.site._id || '',
                    name: user.site.name || ''
                },
                team: {
                    _id: user.team?._id || '',
                    name: user.team?.name || ''
                },
                roles: user.roles || ['']
            }));

            const selectedData = data.map(row => {
                const rowData: any[] = [];
                this.selectedColumns.forEach(column => {
                    if (column.startsWith('region.')) {
                        const subProperty = column.split('.')[1];
                        rowData.push(((row.region as {[key: string]: string})[subProperty]));
                    } else if (column.startsWith('site.')) {
                        const subProperty = column.split('.')[1];
                        rowData.push(((row.site as {[key: string]: string})[subProperty]));
                    } else if (column.startsWith('team.')) {
                        const subProperty = column.split('.')[1];
                        rowData.push(((row.team as {[key: string]: string})[subProperty]));
                    } else {
                        rowData.push((row as any)[column]);
                    }
                });
                return rowData;
            });

            const headers = this.selectedColumns.map((column: string) => {
                if (column === '_id') return 'ID';
                if (column === 'name') return 'Name';
                if (column === 'email') return 'Email';
                if (column === 'discordUsername') return 'Discord';
                if (column === 'region.name') return 'Region';
                if (column === 'site.name') return 'Site';
                if (column === 'team.name') return 'Team';
                if (column === 'roles') return 'Role';
                return column.replace(/[A-Z]/g, ' $&').toUpperCase();
            });

            autoTable(doc, {
                head: [headers],
                body: selectedData
            });

            doc.save('users.pdf');
        },
        error => {
            console.error('Error fetching teams:', error);
        }
    );
    */
  }


  get paginasMostradas(): (number | '...')[] {
    const totalPaginas = this.totalPaginas;
    const currentPage = this.currentPage;
    const paginasMostradas: (number | '...')[] = [];

    const rango = 2; // Cambia esto para ajustar el número de páginas mostradas

    let inicio = Math.max(1, currentPage - rango);
    let fin = Math.min(totalPaginas, currentPage + rango);

    for (let i = inicio; i <= fin; i++) {
      paginasMostradas.push(i);
    }

    if (currentPage - inicio > rango) {
      paginasMostradas.unshift('...');
    }

    if (fin < totalPaginas - 1) {
      paginasMostradas.push('...');
    }
    return paginasMostradas;
  }
}
