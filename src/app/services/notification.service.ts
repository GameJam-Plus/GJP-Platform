import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.prod';

export type NotificationPayload = {
  _id?: string;
  readBy?: Array<{
    userId: string | { _id?: string };
    readAt?: Date | string;
  }>;
  titlePT: string;
  titleES: string;
  titleEN: string;
  descriptionPT: string;
  descriptionES: string;
  descriptionEN: string;
  createdAt?: Date | string;
  expiresAt?: Date | string;
};

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  url: string = `${environment.apiUrl}/api/notification/`;

  constructor(private http: HttpClient) {}

  createNotification(notification: NotificationPayload): Observable<NotificationPayload> {
    return this.http.post<any>(`${this.url}create-notification`, notification, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }

  getNotifications(): Observable<NotificationPayload[]> {
    return this.http.get<any>(`${this.url}get-notifications`, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }

  updateNotification(notificationId: string, notification: NotificationPayload): Observable<NotificationPayload> {
    return this.http.put<any>(`${this.url}update-notification/${notificationId}`, notification, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }

  deleteNotification(notificationId: string): Observable<any> {
    return this.http.delete<any>(`${this.url}delete-notification/${notificationId}`, { withCredentials: true });
  }

  markAllAsRead(): Observable<any> {
    return this.http.post<any>(`${this.url}mark-all-read`, {}, { withCredentials: true });
  }
}
