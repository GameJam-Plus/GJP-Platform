import { Component, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCoffee, faJar, faUsers } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [
    FontAwesomeModule,
    TranslatePipe
  ],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css'
})
export class SideBarComponent {
  @Input() jamData!: any;

  faCoffee = faCoffee;
  faJar = faJar;
  faUsers = faUsers;
}
