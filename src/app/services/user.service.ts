import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../types';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  url : string = `https://${environment.apiUrl}/api/user/`;

  constructor(private http: HttpClient) {}

  registerUser(user: User): Observable<any> {
    return this.http.post(this.url + 'register-user', user);
  }

  updateUser(userId: string, user: User): Observable<any> {
    return this.http.put(this.url + `update-user/${userId}`, user);
  }

  loginUser(email: string): Observable<any> {
    return this.http.post(this.url + 'login-user', { email });
  }

  logOutUser(url: string): Observable<any> {
    return this.http.get(url, { withCredentials: true });
  }

  getUsers(url: string): Observable<User[]> {
    return this.http.get<any>(url).pipe(
      map(response => response.data)
    );
  }

  getCurrentUser(url: string): Observable<User> {
    return this.http.get<any>(url, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }

  deleteUser(url: string): Observable<any> {
    return this.http.delete(url);
  }

  getLocalsSite(url: string): Observable<User[]> {
    return this.http.get<any>(url).pipe(
      map(response => response.data)
    );
  }

  getJammersPerSite(url: string): Observable<User[]> {
    return this.http.get<any>(url).pipe(
      map(response => response.data)
    );
  }

  getStaffPerSite(url: string): Observable<User[]> {
    return this.http.get<any>(url).pipe(
      map(response => response.data)
    );
  }

  updateUserSite(url: string, siteId: string): Observable<any> {
    return this.http.put(url, siteId);
  }

  uploadUsersFromCSV(siteId: string, jamId: string, data: any): Observable<any> {
    return this.http.post<any>(this.url + `register-users-from-csv/${siteId}/${jamId}`, {data: data}, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }

  saveJammerData(userId: string, siteId: string, jamId: string, jammerData: any): Observable<any> {
    return this.http.post<any>(this.url + `save-jammer-data`, {userId: userId, siteId: siteId, jamId: jamId, data: jammerData}, {withCredentials: true}).pipe(
      map(response => response.data)
    );
  }
}

