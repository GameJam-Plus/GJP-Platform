import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Team, User } from '../../types';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  constructor(private http: HttpClient) { }

  createTeam(url: string, team: Team): Observable<Team> {
    return this.http.post<any>(url, team, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }

  joinTeam(url: string, data: any) : Observable<Team> {
    return this.http.post<any>(url, data, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }

  getTeamById(url: string): Observable<Team> { 
    return this.http.post<any>(url, { withCredentials: true }).pipe(
      map(response => response.data) 
    );
  }

  addJammerToTeam(url: string): Observable<Team> {
    return this.http.put<any>(url, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }

  removeJammerFromTeam(url: string): Observable<any> {
    return this.http.delete(url, { withCredentials: true });
  }

  updateTeam(url: string, team: Team): Observable<any> {
    return this.http.put(url, team, { withCredentials: true });
  }

  updateTeamOwner(url: string): Observable<any> {
    return this.http.put(url, { withCredentials: true});
  }

  getTeam(url: string): Observable<Team> {
    return this.http.get<any>(url).pipe(
      map(response => response.data)
    );
  }
  
  getTeams(url: string): Observable<Team[]> { 
    return this.http.get<any>(url).pipe( 
      map(response => response.data)
    );
  }

  deleteTeam(url: string): Observable<any> {
    return this.http.delete(url);
  }
  
  getTeamsSite(url: string): Observable<Team[]> { 
    return this.http.get<any>(url).pipe( 
      map(response => response.data)
    );
  }

  getJammersPerTeam(url: string): Observable<User[]> {
    return this.http.get<any>(url).pipe(
      map(response => response.data)
    );
  }
}
