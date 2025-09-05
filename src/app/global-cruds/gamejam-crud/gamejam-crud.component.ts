import { Component, OnInit, ViewChild, ElementRef  } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { GameJam, Theme, Jam } from '../../../types';
import { ThemeService } from '../../services/theme.service';
import { GamejamService } from '../../services/gamejam.service';
import { JamService } from '../../services/jam.service';
declare var $: any;
import { jsPDF }  from 'jspdf';
import autoTable from 'jspdf-autotable';
import { environment } from '../../../environments/environment.prod';

@Component({
  selector: 'app-gamejam-crud',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './gamejam-crud.component.html',
  styleUrl: './gamejam-crud.component.css'
})
export class GamejamCrudComponent implements OnInit {
  myForm!: FormGroup;
  dataSource: GameJam[] = [];
  jams: Jam[] = [];
  gthemes: Theme[] = [];
  selectedColumns: (keyof GameJam)[] = [];
  columnOptions = [
    { label: 'Edition', value: 'edition' as keyof GameJam, checked: false },
    { label: 'Themes', value: 'themes.titleEN' as keyof GameJam, checked: false },
  ];

  userToEdit: any;
  indexUser = 0;
  selectedHeader: string | undefined;
  filterValue: string = '';

  constructor(private fb: FormBuilder, private gamejamService: GamejamService, private jamService: JamService, private themeService: ThemeService) {}

  ngOnInit(): void {
    this.myForm = this.fb.group({
      edition: ['', Validators.required],
      themes: this.fb.array([]),
      selectedTheme: ['']
    });

    this.jamService.listJams().subscribe({
      next: (jams: Jam[]) => {
        this.jams = jams;
      },
      error: (error) => {
        console.log(error.error.message);
      }
    });

    this.gamejamService.getGameJams(`${environment.apiUrl}:3000/api/game-jam/get-game-jams`).subscribe(
      (gamejams: GameJam[]) => {
        this.dataSource = gamejams;
      },
      error => {
        console.error('Error al obtener las GameJams:', error);
      }
    );

    this.themeService.getThemes(`${environment.apiUrl}:3000/api/theme/get-themes`).subscribe(
      (themes: Theme[]) => {
        this.gthemes = themes;
      },
      error => {
        console.error('Error al obtener temas:', error);
      }
    );

    this.pageSize = localStorage.getItem("PageSize") ? +localStorage.getItem("PageSize")! : 20;
  }



  toggleColumn(column: keyof GameJam, event: any) {
    if (event.target.checked) {
      this.selectedColumns.push(column);
    } else {
      this.selectedColumns = this.selectedColumns.filter(c => c !== column);
    }
  }

  addTheme() {
    const selectedTheme = this.myForm.get('selectedTheme');
    if(selectedTheme && selectedTheme.value){
      const themeValue : Theme = selectedTheme.value;
      const themesArray = this.myForm.get('themes') as FormArray;
      if(!themesArray.value.some((theme: Theme) => theme._id === themeValue._id)){
        themesArray.push(this.fb.control(themeValue));
      }
    }
  }


  removeTheme(theme: Theme) {
    const themesArray = this.myForm.get('themes') as FormArray;
    const index = themesArray.controls.findIndex(control => control.value._id === theme._id);
    if(index !== -1){
      themesArray.removeAt(index);
    }
  }

  exportToPDF() {
    const doc = new jsPDF();

    // Obtener datos filtrados
    const selectedData = this.obtenerDatosPagina().map(row => {
      /*
      const rowData: any[] = [];
      this.selectedColumns.forEach(column => {
        if (column.startsWith('themes.')) {
          const themeProperty = column.split('.')[1]; // Remove the type assertion for now
          const themeValue = row.themes?.map((theme: any) => theme[themeProperty]).join(', '); // Adjust the type to 'any' temporarily
          rowData.push(themeValue);
        } else {
          rowData.push(row[column as keyof Jam] !== undefined ? row[column as keyof Jam] : '');
        }
      });
      return rowData;*/
    });

    // Crear encabezados
    const headers = this.selectedColumns.map((column: string) => {
      if (column === '_id') return 'ID';
      if (column === 'edition') return 'Edition';
      if (column === 'themes._id') return 'Theme ID';
      if (column === 'themes.titleEN') return 'Theme Title';
      return column.replace(/\b\w/g, char => char.toUpperCase()).replace(/[A-Z]/g, ' $&').trim();
    });

    // Generar tabla en el PDF
    autoTable(doc, {
      /*
      head: [headers],
      body: selectedData*/
    });

    // Guardar el PDF
    doc.save('gameJams.pdf');
  }


  seleccionarElemento(elemento: any) {
    this.userToEdit = elemento;
    this.indexUser = this.dataSource.indexOf(elemento);
    this.myForm.patchValue({
      edition: elemento.edition,
    });
    const themesArray = this.myForm.get('themes') as FormArray;
    themesArray.clear();
    elemento.themes.forEach((theme: Theme) => {
      themesArray.push(this.fb.group({
        _id: theme._id,
        titleEN: theme.titleEN,
      }));
    });
  }

  editar() {
    if (this.myForm.valid) {
      const gamejamId = this.userToEdit['_id'];
      const { edition, themes } = this.myForm.value;

      this.gamejamService.updateGameJam(`${environment.apiUrl}:3000/api/game-jam/update-game-jam/${gamejamId}`, {
        edition,
        themes: themes.map((t: Theme) => ({ _id: t._id, titleEN: t.titleEN }))
      }).subscribe({
        next: (data) => {
          if (data.success) {
            this.dataSource[this.indexUser] = { _id: gamejamId, edition, themes: themes.map((theme: { _id: string; titleEN: string; }) => ({
              _id: theme._id,
              titleEN: theme.titleEN
            })) };
            this.showSuccessMessage(data.msg);
          } else {
            this.showErrorMessage(data.error);
          }
        },
        error: (error) => {
          this.showErrorMessage(error.error.error);
        },
      });
    } else {
      this.showErrorMessage('Please fill in all fields of the form');
    }
  }

  eliminar(elemento: any) {
    const id = elemento._id;
    const url = `${environment.apiUrl}:3000/api/game-jam/delete-game-jam/${id}`;

    this.gamejamService.deleteGameJam(url).subscribe({
      next: (data) => {
        console.log('GameJam eliminada correctamente:', data);
        this.dataSource = this.dataSource.filter(item => item !== elemento);
        this.showSuccessMessage(data.msg);
      },
      error: (error) => {
        console.error('Error al eliminar la GameJam:', error);
        this.showErrorMessage(error.error.msg);
      }
    });
  }

  agregar() {
    if (this.myForm.valid) {
      console.log('Formulario válido');

      const { edition, themes } = this.myForm.value;
      this.gamejamService.createGameJam(`${environment.apiUrl}:3000/api/game-jam/create-game-jam`, {
        edition: edition,
        themes: themes.map((t: Theme) => ({ _id: t._id, titleEN: t.titleEN }))
      }).subscribe({
        next: (data) => {
          if (data.success) {
            const gameJamId = data.gameJamId;
            this.dataSource.push({ _id: gameJamId, edition: edition, themes: themes.map((theme :{_id : string; titleEN: string;})=>({
              _id : theme._id,
              titleEN : theme.titleEN
            })  ) });
            this.showSuccessMessage(data.msg);
          } else {
            this.showErrorMessage(data.error);
          }
        },
        error: (error) => {
          this.showErrorMessage(error.error.error);
        },
      });
    } else {
      this.showErrorMessage('Please fill in all fields of the form');
    }
  }


  successMessage: string = '';
  errorMessage: string = '';

  showSuccessMessage(message: string) {
    this.successMessage = message;
  }

  showErrorMessage(message: string) {
    this.errorMessage = message;
  }

  get totalPaginas(): number {
    return Math.ceil(this.dataSource.length / this.pageSize);
  }

  pageSize = 5;
  currentPage = 1;

  cambiarPagina(page: number) {
    this.currentPage = page;
  }

  changePageSize(e: any)
  {
    this.pageSize = e.srcElement.value;
    this.cambiarPagina(1);
    localStorage.setItem("PageSize", `${this.pageSize}`);
  }

  getPropertyValue(obj: any, key: string) {
    if (!obj || !key) return '';
    const keys = key.split('.');
    let value = obj;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined || value === null) return '';
    }
    return Array.isArray(value) ? value.join(', ') : value;
  }

  obtenerDatosPagina() {
    let filteredData = this.jams;

    if(this.selectedHeader !== undefined && this.filterValue.trim() !== '')
    {
      const filterText = this.filterValue.trim().toLowerCase();
      filteredData = filteredData.filter(item => {
        switch (this.selectedHeader) {
          case '_id':
            return item._id && item._id.toLowerCase().startsWith(filterText);
          case 'title':
            return item.title.toLowerCase().includes(filterText);
          case 'status':
            if(filterText == 'open') return item.open;
            else if(filterText == 'closed') return !item.open;
            else return true;
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

    const rango = 2;

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

  ventanaAgregar: boolean = false;
}
