import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Theme } from '../../types';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.prod';


@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  constructor(private http: HttpClient) { }

  createTheme(url: string, formData: FormData): Observable<any> {
    return this.http.post(url, formData, { withCredentials: true });
  }

  updateTheme(url: string, formData: FormData): Observable<any> {
    return this.http.put(url, formData, { withCredentials: true });
  }
  
  getThemes(url: string): Observable<Theme[]> { 
    return this.http.get<any>(url).pipe( 
      map(response => response.data)
    );
  }
  
  getTheme(url: string): Observable<Theme> { 
    return this.http.get<any>(url).pipe( 
      map(response => response.theme)
    );
  }
  
  deleteTheme(url: string): Observable<any> {
    return this.http.delete(url);
  }
  private baseUrl = `${environment.apiUrl}:3000/api/theme`;
  getPdf(themeId: string, language: string): Observable<Blob> {
    const url = `${this.baseUrl}/pdf/${themeId}/${language}`;
    return this.http.get(url, { responseType: 'blob' });
  }
}
