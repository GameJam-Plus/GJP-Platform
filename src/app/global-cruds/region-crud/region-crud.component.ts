import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { RegionService } from '../../services/region.service';
import { SiteService } from '../../services/site.service';
import { Region, Site } from '../../../types';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { jsPDF }  from 'jspdf';
import { MessagesComponent } from '../../messages/messages.component';
import autoTable from 'jspdf-autotable';
import { environment } from '../../../environments/environment.prod';
declare var $: any;

@Component({
  selector: 'app-region-crud',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MessagesComponent
  ],
  templateUrl: './region-crud.component.html',
  styleUrl: './region-crud.component.css',
  providers: [BsModalService]
})
export class RegionCrudComponent implements OnInit{
  regionForm!: FormGroup;
  regions: Region[] = [];
  sites: Site[] = [];
  selectedRegion?: Region | null = null;
  columnOptions = [
    { label: 'name', value: 'name' as keyof Region, checked: false },
  ];
  regionToEdit: any;
  indexRegion = 0;
  selectedHeader: string | undefined;
  filterValue: string = '';
  selectedColumns: (keyof Region)[] = [];
  ventanaAgregar: boolean = false;
  @ViewChild('closeRegionModal') closeRegionModal?: ElementRef;
  @ViewChild(MessagesComponent) message!: MessagesComponent;
  modalError: string = "";

  constructor(private fb: FormBuilder, private regionService: RegionService, private siteService: SiteService, private modalService: BsModalService){}

  ngOnInit(): void {
    this.regionForm = this.fb.group({
      region: ['', Validators.required]
    });
    this.listRegions();
    this.listSites();

    this.pageSize = localStorage.getItem("PageSize") ? +localStorage.getItem("PageSize")! : 20;
  }

  listRegions()
  {
    const url = `${environment.apiUrl}:3000/api/region/get-regions`;
    this.regionService.getRegions(url).subscribe({
      next: (regions: Region[]) => {
        this.regions = regions;
      },
      error: (error) => {
        console.error('Error al obtener regiones:', error);
      }
    });
  }

  listSites()
  {
    const url = `${environment.apiUrl}:3000/api/site/get-sites`;
    this.siteService.getSites(url).subscribe({
      next: (sites: Site[]) => {
        this.sites = sites;
      },
      error: (error) => {
        console.error('Error al obtener sitios:', error);
      }
    });
  }

  countSitesPerRegion(regionId?: string)
  {
    const sites = this.sites.filter(site => site.regionId === regionId);
    return sites.length;
  }

  selectRegion(region: Region){
    this.selectedRegion = region;
    this.regionForm.patchValue({
      region: region.name
    });
  }

  saveRegion()
  {
    if(this.selectedRegion)
    {
      this.editRegion();
    }
    else
    {
      this.addRegion();
    }
  }

  addRegion() {
    if (this.regionForm.valid) {
      var regionName = this.regionForm.value["region"];
      this.regionService.createRegion(`${environment.apiUrl}:3000/api/region/create-region`, {
        name: regionName,
      }).subscribe({
        next: (data) => {
          console.log(data);
          if (data.success) {
            const regionId = data.regionId;
            this.regions.push({ _id: regionId, name: this.regionForm.value["region"] });
            this.message.showMessage("Success", data.message);
            this.closeModal();
            this.listRegions();
          } else {
            this.modalError = data.error;
            //this.showErrorMessage(data.error);
          }
        },
        error: (error) => {
          console.log(error.error.message);
          this.modalError = error.error.message;
          //this.showErrorMessage(error.error.error); // Mostrar el mensaje de error del backend
        },
      });
    } else {
      this.modalError = 'Please fill in all fields of the form';
      //this.showErrorMessage('Please fill in all fields of the form');
    }
  }

  editRegion() {
    if (this.regionForm.valid) {
      const regionId = this.selectedRegion!._id;

      const region: Region = {
        name: this.regionForm.value['region']
      };

      const url = `${environment.apiUrl}:3000/api/region/update-region/${regionId}`;

      this.regionService.updateRegion(url, {
        name: this.regionForm.value['region']
      }).subscribe({
        next: (data) => {
          console.log('Respuesta del servidor:', data);
          this.regions[this.indexRegion] = {
            _id: regionId,
            name: this.regionForm.value['region']
          };
          this.message.showMessage('Success', 'Region updated successfully!');
          this.selectedRegion = undefined;
          this.clearForm();
          this.closeModal();
          this.listRegions();
        },
        error: (error) => {
          this.modalError = error.error.message;
        }
      });
    } else {
      this.modalError = 'Please fill in all fields of the form';
      //this.showErrorMessage('Please fill in all fields of the form');
    }
  }

  clearForm()
  {
    this.regionForm.setValue({
      region: ''
    });
    this.selectedRegion = null;
    this.modalError = '';
  }

  deleteRegion(region: Region) {
    this.message.showDialog(
      "Confirm Action",
      `Delete region with name ${region.name}`,
      () => {
        const id = region._id;
        const url = `${environment.apiUrl}:3000/api/region/delete-region/${id}`;
        this.regionService.deleteRegion(url).subscribe({
            next: (data) => {
                this.message.showMessage("Success", data.message);
                this.listRegions();
            },
            error: (error) => {
                console.error('Error al eliminar el elemento:', error);
                this.message.showMessage("Error", error.error.message);
            }
        });},
      () => {}
    );
  }

  toggleColumn(column: keyof Region, event: any) {
    if (event.target.checked) {
      this.selectedColumns.push(column);
    } else {
      this.selectedColumns = this.selectedColumns.filter(c => c !== column);
    }
  }

  exportToPDF() {
    const doc = new jsPDF();

    const selectedData = this.regions.map(row => {
      const rowData: any[] = [];
      this.selectedColumns.forEach(column => {
        rowData.push(row[column] || '');
      });
      return rowData;
    });

    const headers = this.selectedColumns.map((column: string) => {
      if (column === '_id') return 'ID';
      if (column === 'name') return 'Name';
      return column.replace(/[A-Z]/g, ' $&').toUpperCase();
    });

    autoTable(doc, {
      head: [headers],
      body: selectedData
    });

    doc.save('regions.pdf');
  }



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////Lógica de Interfaz///////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  get totalPaginas(): number {
    return Math.ceil(this.regions.length / this.pageSize);
  }

  pageSize = 5; // Elements per page
  currentPage = 1;

  changePage(page: number) {
    this.currentPage = page;
  }

  changePageSize(e: any)
  {
    this.pageSize = e.srcElement.value;
    this.changePage(1);
    localStorage.setItem("PageSize", `${this.pageSize}`);
  }

  // Función para obtener los datos de la página actual
  getRows() {
    let filteredData = this.regions;

    if (this.selectedHeader !== undefined && this.filterValue.trim() !== '') {
      const filterText = this.filterValue.trim().toLowerCase();
      filteredData = filteredData.filter(item => {
        switch (this.selectedHeader) {
          case '_id':
            return item._id && item._id.toLowerCase().startsWith(filterText);
          case 'name':
            return item.name.toLowerCase().startsWith(filterText);
          default:
            return false;
        }
      });
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    return filteredData.slice(startIndex, startIndex + this.pageSize);
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

  closeModal(): void{
    this.clearForm();
    this.closeRegionModal?.nativeElement.click();
  }
}
