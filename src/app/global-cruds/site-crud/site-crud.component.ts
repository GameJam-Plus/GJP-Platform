import { Component, OnInit, ViewChild, ElementRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Country, Region, Site } from '../../../types';
import { RegionService } from '../../services/region.service';
import { SiteService } from '../../services/site.service';
import { MessagesComponent } from '../../messages/messages.component';
declare var $: any;
import { jsPDF }  from 'jspdf';
import autoTable from 'jspdf-autotable';
import { environment } from '../../../environments/environment.prod';

@Component({
  selector: 'app-site-crud',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MessagesComponent
  ],
  templateUrl: './site-crud.component.html',
  styleUrl: './site-crud.component.css'
})
export class SiteCrudComponent implements OnInit {
  siteForm!: FormGroup;
  sites: Site[] = [];
  filteredSites: Site[] = [];
  regions: Region[] = [];
  countries: Country[] = [];
  columnOptions = [
    { label: 'Name', value: 'name' as keyof Site, checked: false },
    { label: 'Modality', value: 'modality' as keyof Site, checked: false },
    { label: 'Region Name', value: 'region.name' as keyof Site, checked: false },
    { label: 'Country Name', value: 'country.name' as keyof Site, checked: false },
  ];

  selectedSite: Site | null = null;
  indexSite = 0;
  selectedHeader: string | undefined;
  filterValue: string = '';
  filter: any = {};
  selectedColumns: (keyof Site)[] = [];
  modalError: string = '';
  @ViewChild('closeSiteModal') closeSiteModal?: ElementRef;
  @ViewChild(MessagesComponent) message!: MessagesComponent;

  constructor(private fb: FormBuilder, private siteService: SiteService, private regionService: RegionService){}
  ngOnInit(): void {
    this.siteForm = this.fb.group({
      name: ['', Validators.required],
      modality: ['', Validators.required],
      region: ['', Validators.required],
      country: ['', Validators.required],
      city: [''],
      organizer: ['']
    });

    this.listRegions();
    this.listCountries();
    this.listSites();

    this.pageSize = localStorage.getItem("PageSize") ? +localStorage.getItem("PageSize")! : 20;
  }

  listRegions()
  {
    this.regionService.getRegions(`${environment.apiUrl}/api/region/get-regions`).subscribe({
      next: (regions) => {
        this.regions = regions;
      },
      error: (error) => {
        console.error('Error al obtener regiones:', error);
      }
    });
  }

  listCountries()
  {
    this.siteService.getCountries(`${environment.apiUrl}/api/site/get-countries`).subscribe({
      next: (countries) => {
        this.countries = countries;
      },
      error: (error) => {
        console.error('Error al obtener países:', error);
      }
    });
  }

  listSites()
  {
    //console.log("Fetching sites...");
    //let start = new Date();
    this.siteService.getSites(`${environment.apiUrl}/api/site/get-sites`).subscribe({
      next: (sites: Site[]) => {
        //let delta = (new Date()).getMilliseconds() - start.getMilliseconds();
        //console.log(`Sites loaded at ${delta / 1000} seconds`);
        this.sites = sites;
        this.filteredSites = this.getRows();
      },
      error: (error) => {
        console.error('Error al obtener sitios:', error);
      }
    });
  }

  getRegionName(regionId: string)
  {
    const region = this.regions.find(region => region._id === regionId);
    return region?.name;
  }

  selectSite(site: Site) {
    this.selectedSite = site;
    const selectedRegion = this.regions.find(region => region._id === site.regionId);
    const selectedCountry = this.countries.find(country => country.name === site.country.name);
    

    this.siteForm.patchValue({
      name: site.name,
      modality: site.modality,
      region: selectedRegion,
      country: selectedCountry,
      city: site.city,
      organizer: site.organizer
    });
  }

  saveSite() {
    if(this.selectedSite)
    {
      this.editSite();
    }
    else
    {
      this.addSite();
    }
  }

  editSite() {
    // TODO change this method to send full country struct
    if (this.siteForm.valid) {
      const siteId = this.selectedSite!._id;
      const url = `${environment.apiUrl}/api/site/update-site/${siteId}`;

      console.log(this.siteForm.value["country"].name);
      this.siteService.updateSite(url, {
        name: this.siteForm.value["name"],
        modality: this.siteForm.value["modality"],
        regionId: this.siteForm.value["region"]?._id,
        country: this.siteForm.value["country"].name,
        city: this.siteForm.value["city"],
        organizer: this.siteForm.value["creatorUser"]?._id
      }).subscribe({
        next: (data) => {
          this.listSites();
          this.message.showMessage('Success', 'Site updated successfully!');
          this.selectedSite = null;
          this.clearForm();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error al actualizar el site:', error);
          this.modalError = error.error.message;
          //this.message.showMessage('Error', error.error.message);
        }
      });
    } else {
      this.modalError = 'Please fill all fields in the form';
      //this.message.showMessage('Error', 'Please fill in all fields of the form');
    }
  }

  deleteSite(site: Site) {
    const id = site._id;
    this.message.showDialog(
      'Confirm Action',
      'If you delete this site, all its users will remain in the system. Proceed?',
      () => {
        const url = `${environment.apiUrl}/api/site/delete-site/${id}`;

        this.siteService.deleteSite(url).subscribe({
            next: (data) => {
                this.listSites();
                this.message.showMessage('Success', data.message);
            },
            error: (error) => {
                this.message.showMessage('Error', error.error.message);
            }
        });
      }
    );
  }

  addSite() {
    // TODO change this method to send full country struct
    if (this.siteForm.valid) {
      this.siteService.createSite(`${environment.apiUrl}/api/site/create-site`, {
        name: this.siteForm.value["name"],
        modality: this.siteForm.value["modality"],
        regionId: this.siteForm.value["region"]?._id,
        country: this.siteForm.value["country"].name,
        city: this.siteForm.value["city"],
        organizer: this.siteForm.value["organizer"]
      }).subscribe({
        next: (data) => {
          if (data.success) {
            const siteId = data.siteId;
            this.listSites();
            this.message.showMessage('Success', data.message);
            this.clearForm();
            this.closeModal();
          }
          else
          {
            this.modalError = data.message;
          }
        },
        error: (error) => {
          this.modalError = error.error.message;
        },
      });
    } else {
      this.modalError = 'Please fill in all fields of the form';
    }
  }


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////Lógica de Interfaz///////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  get totalPaginas(): number {
    return Math.ceil(this.sites.length / this.pageSize);
  }

  pageSize = 5; // Número de elementos por página
  currentPage = 1; // Página actual

  // Función para cambiar de página
  cambiarPagina(page: number) {
    this.currentPage = page;
    this.filteredSites = this.getRows();
  }

  changePageSize(e: any)
  {
    this.pageSize = e.srcElement.value;
    this.cambiarPagina(1);
    localStorage.setItem("PageSize", `${this.pageSize}`);
    this.filteredSites = this.getRows();
  }

  setFilter(filterType: string, value: any)
  {
    switch(filterType)
    {
      case 'region':
        let regions = new Array();
        for(var o = 0; o < value.length; ++o)
        {
          regions.push(value[o].value);
        }
        this.filter.regions = regions;
        break;
      case 'organizer':
        this.filter.organizer = value;
        break;  
      case 'country':
        let countries = new Array();
        for(var o = 0; o < value.length; ++o)
        {
          countries.push(value[o].value);
        }
        this.filter.countries = countries;
        break;
      case 'city':
        this.filter.city = value;
        break;
      case 'name':
        this.filter.name = value;
        break;
      case 'modality':
        let modalities = new Array();
        for(var o = 0; o < value.length; ++o)
        {
          modalities.push(value[o].value);
        }
        this.filter.modalities = modalities;
        break;  
      case 'status':
        let statuses = new Array();
        for(var o = 0; o < value.length; ++o)
        {
          statuses.push(value[o].value === "true");
        }
        this.filter.statuses = statuses;
        break; 
    }
    console.log(this.filter);
    this.filteredSites = this.getRows();
  }

  clearFilters(filterRegion: any, filterCountry: any, filterCity: any, filterOrganizer: any, filterName: any, filterModality: any, filterStatus: any)
  {
    filterRegion.selectedIndex = -1;
    filterCountry.selectedIndex = -1;
    filterCity.value = '';
    filterOrganizer.value = '';
    filterName.value = '';
    filterModality.selectedIndex = -1;
    filterStatus.selectedIndex = -1;
    this.filter = {};
    this.filteredSites = this.getRows();
  }

  // Función para obtener los datos de la página actual
  getRows() {
    let filteredData = this.sites;
    filteredData = filteredData.filter(item => {
      let valid = true;
      
      if(this.filter.regions && this.filter.regions.length > 0)
        valid = valid && this.filter.regions.includes(item.regionId);
      if(this.filter.organizer)
        valid = valid && (item.organizer ? item.organizer.toLowerCase().includes(this.filter.organizer.toLowerCase()) : false);
      if(this.filter.countries && this.filter.countries.length > 0)
        valid = valid && this.filter.countries.includes(item.country.code);
      if(this.filter.city)
        valid = valid && (item.city ? item.city.toLowerCase().includes(this.filter.city.toLowerCase()) : false);
      if(this.filter.name)
        valid = valid && item.name.toLowerCase().includes(this.filter.name.toLowerCase());
      if(this.filter.modalities && this.filter.modalities.length > 0)
        valid = valid && item.modality ? this.filter.modalities.includes(item.modality) : false;
      if(this.filter.statuses)
        valid = valid && this.filter.statuses.includes(item.open);
      return valid;
    });

    const startIndex = (this.currentPage - 1) * this.pageSize;
    return filteredData.slice(startIndex, startIndex + this.pageSize);
  }

  getPropertyValue(obj: any, key: string) {
    if (!obj || !key) return '';
    const keys = key.split('.');
    let value = obj;
    for (const k of keys) {
      value = value[k];
      if (value === undefined || value === null) return '';
    }
    return value;
  }
  toggleColumn(column: keyof Site, event: any) {
    if (event.target.checked) {
      this.selectedColumns.push(column);
    } else {
      this.selectedColumns = this.selectedColumns.filter(c => c !== column);
    }
  }
  exportToPDF() {
    const doc = new jsPDF();

    const url = `${environment.apiUrl}/api/site/get-sites`;
    this.siteService.getSites(url).subscribe(
      (sites: Site[]) => {
        const data = sites.map(site => ({
          _id: site._id || '',
          name: site.name || '',
          modality: site.modality,
          regionId: site.regionId || '',
          country: {
            name: site.country.name || '',
            code: site.country.code || ''
          }
        }));
        // TODO FIX EXPORT WITH REGION NAMES
        const selectedData = data.map(row => {
          const rowData: any[] = [];
          this.selectedColumns.forEach(column => {
            if (column.startsWith('country.')) {
              const subProperty = column.split('.')[1];
              rowData.push(((row.country as {[key: string]: string})[subProperty]));
            } else {
              rowData.push((row as any)[column]);
            }
          });
          return rowData;
        });

        const headers = this.selectedColumns.map((column: string) => {
          if (column === '_id') return 'ID';
          if (column === 'modality') return 'Modality';
          if (column === 'region._id') return 'Region ID';
          if (column === 'region.name') return 'Region Name';
          if (column === 'country.name') return 'Country Name';
          if (column === 'country.code') return 'Country Code';
          return column.replace(/[A-Z]/g, ' $&').toUpperCase();
        });

        autoTable(doc, {
          head: [headers],
          body: selectedData
        });

        doc.save('sites.pdf');
      },
      error => {
        console.error('Error al obtener los sitios:', error);
      }
    );
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

  clearForm()
  {
    this.siteForm.setValue({
      name: '',
      modality: '',
      country: '',
      city: '',
      region: '',
      organizer: ''
    });
    this.modalError = '';
    this.selectedSite = null;
  }

  closeModal(): void{
    this.clearForm();
    this.closeSiteModal?.nativeElement.click();
  }

  ventanaAgregar: boolean = false;
}
