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
      const supportedLanguages = ['en-US', 'es-MX', 'pt-BR', 'zh-CN'];
      const defaultLanguage = 'en-US';

      const cultureLanguage = this.translate.getBrowserCultureLang();
      const language = this.translate.getBrowserLang();

      this.translate.addLangs(supportedLanguages);
      this.translate.setFallbackLang(defaultLanguage);

      if(cultureLanguage && language) {
        if(supportedLanguages.includes(cultureLanguage)) {
          this.translate.use(cultureLanguage);
          console.log('Exact culture language used: ', cultureLanguage);
        }
        else {
          const fallbackLanguage = supportedLanguages.find(lang => lang.startsWith(language));
          
          if (fallbackLanguage) {
            this.translate.use(fallbackLanguage);
            console.log('Fallback language used: ', fallbackLanguage);
          }
          else {
            this.translate.use(defaultLanguage);
            console.log('Default language used: ', defaultLanguage);
          }
        }
      }
    }
  }
}
