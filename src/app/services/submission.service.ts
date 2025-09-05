import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Rating, Submission } from '../../types';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class SubmissionService {
  url : string = `${environment.apiUrl}/api/submission/`;

  constructor(private http: HttpClient) { }

  createSubmission(submission: Submission): Observable<Submission> {
    return this.http.post<any>(`${ this.url }create-submission`, submission, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }

  updatePitch(pitch: any): Observable<Submission> {
    return this.http.post<any>(`${ this.url }update-pitch`, pitch, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }

  getSubmissionByTeam(teamId: string): Observable<Submission> {
    return this.http.get<any>(`${ this.url }get-submission-by-team/${teamId}`).pipe(
      map(response => response.data)
    );
  }

  getSubmissionsBySite(siteId: string, jamId: string): Observable<any> {
    return this.http.get<any>(`${ this.url }get-submissions-by-site/${siteId}/${jamId}`).pipe(
      map(response => response.data)
    );
  }

  getSubmissionsByJam(jamId: string): Observable<any> {
    return this.http.get<any>(`${ this.url }get-submissions-by-jam/${jamId}`).pipe(
      map(response => response.data)
    );
  }

  getSubmissionsData(jamId: string): Observable<any> {
    return this.http.get<any>(`${ this.url }get-submissions-data/${jamId}`).pipe(
      map(response => response.data)
    );
  }

  updateSubmission(url: string, team: Submission): Observable<any> {
    return this.http.put(url, team, { withCredentials: true });
  }

  getSubmission(url: string): Observable<Submission> {
    return this.http.get<any>(url, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }
  getSubmissionName(url: string): Observable<Submission> {
    return this.http.get<any>(url, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }

  getCurrentTeamSubmission(url: string): Observable<Submission> {
    return this.http.get<any>(url, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }

  giveRating(url: string, evaluation: Rating): Observable<any> {
    return this.http.post(url, evaluation, { withCredentials: true });
  }

  getRating(url: string): Observable<Rating>{
    return this.http.get<any>(url, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }

  getSubmissionsEvaluator(url: string): Observable<Submission[]>{
    return this.http.get<any>(url, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }

  getRatingsEvaluator(url: string): Observable<Submission[]>{
    return this.http.get<any>(url, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }

}
