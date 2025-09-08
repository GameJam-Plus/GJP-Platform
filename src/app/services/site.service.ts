import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Country, Site, Jam } from '../../types';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class SiteService {

  url: string = `${environment.apiUrl}/api/site/`;

  constructor(private http: HttpClient) { }

  createSite(url: string, site: Site): Observable<any> {
    return this.http.post(url, site, { withCredentials: true });
  }

  updateSite(url: string, site: Site): Observable<any> {
    return this.http.put(url, site, { withCredentials: true });
  }

  getSites(url: string): Observable<Site[]> {
    return this.http.get<any>(url).pipe(
      map(response => response.data)
    );
  }

  getSitesPerJam(url: string): Observable<Site[]> {
    return this.http.get<any>(url).pipe(
      map(response => response.data)
    );
  }

  getSite(url: string): Observable<Site> {
    return this.http.get<any>(url, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }

  getAllSitesInfo(): Observable<any> {
    return this.http.get<any>(this.url + "get-all-sites-info").pipe(
      map(response => response.data)
    );
  }

  getCountries(url: string): Observable<Country[]> {
    return this.http.get<any>(url).pipe(
      map(response => response.data)
    );
  }

  getSubmissions(url: string): Observable<any[]> {
    return this.http.get<any>(url, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }
  getSubmissionsByName(url: string): Observable<any[]> {
    return this.http.get<any>(url, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }

  getSitesPerRegion(url: string): Observable<Site[]> {
    return this.http.get<any>(url).pipe(
      map(response => response.data)
    );
  }

  joinSite(url: string, data: any): Observable<any> {
    return this.http.put<any>(url, data).pipe(
      map(response => response.data)
    );
  }

  exitSite(url: string, data: any): Observable<any> {
    return this.http.put(url, data);
  }

  deleteSite(url: string): Observable<any> {
    return this.http.delete(url);
  }
}
