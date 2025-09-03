import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit {
  title = 'GJ-Platform';

  constructor(private translate: TranslateService, @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if(isPlatformBrowser(this.platformId)) {
      const savedLanguage = localStorage.getItem('language');
      const defaultLanguage = 'pt';

      this.translate.addLangs(['en', 'es', 'pt', 'zh']);
      this.translate.setFallbackLang(defaultLanguage);

      if(savedLanguage) {
        this.translate.use(savedLanguage);
      } else {
        this.translate.use(defaultLanguage);
      }
    }
  }
}
