import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Jam } from '../../types';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.prod';
import { response } from 'express';

@Injectable({
  providedIn: 'root'
})
export class JamService {

  url: string = `${environment.apiUrl}/api/jam/`;

  constructor(private http: HttpClient) { }

  createJam(jam: Jam): Observable<any>{
    return this.http.post(this.url + 'create-jam', jam, {withCredentials: true});
  }

  updateJam(jamId: string, jam: Jam): Observable<any>{
    return this.http.put(this.url + `update-jam/${jamId}`, jam, {withCredentials: true});
  }

  getCurrentJam(): Observable<Jam> {
    return this.http.get<any>(this.url + 'get-current-jam').pipe(
      map(response => response.data)
    );
  }

  countJamData(jamId: string): Observable<any> {
    return this.http.get<any>(this.url + `count-jam-data/${jamId}`).pipe(
      map(response => response.data)
    );
  }

  getJamBySite(siteId: string): Observable<Jam>{
    return this.http.get<any>(this.url + `get-jam-by-site/${siteId}`).pipe(
      map(response => response.data)
    );
  }

  getJamByUser(userId: string): Observable<any>{
    return this.http.get<any>(this.url + `get-jam-by-user/${userId}`).pipe(
      map(response => response.data)
    );
  }

  joinSiteToJam(link: any): Observable<Jam>{
    return this.http.post<any>(this.url + 'join-site-jam', link).pipe(
      map(response => response.data)
    );
  }

  listJams(): Observable<Jam[]>{
    return this.http.get<any>(this.url + 'list-jams').pipe(
      map(response => response.data)
    );
  }

  listOpenJams(): Observable<Jam[]>{
    return this.http.get<any>(this.url + 'list-open-jams').pipe(
      map(response => response.data)
    );
  }
}
