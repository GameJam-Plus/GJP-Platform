import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Chat } from '../../types';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private baseUrl = `${environment.apiUrl}/api/chat/`;

  constructor(private http: HttpClient) {}

createChat(chat: Chat): Observable<any> {
  return this.http.post(`${this.baseUrl}create-chat`, { participants: chat.participants }, { withCredentials: true });
}


  getChat(id: string): Observable<Chat> {
    return this.http.get<{ data: Chat }>(`${this.baseUrl}get-chat/${id}`, { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }

  getChatbyParticipants(participantIds: string[]): Observable<Chat> {
    const queryParams = participantIds.map(id => `participantIds=${encodeURIComponent(id)}`).join('&');
    return this.http.get<{ data: Chat }>(`${this.baseUrl}get-chat-by-participants?${queryParams}`, { withCredentials: true }).pipe(
        map(response => response.data)
    );
}

getJammerChat(teamName: string): Observable<Chat> {
  const queryParams = `teamName=${encodeURIComponent(teamName)}`;
  return this.http.get<{ data: Chat }>(`${this.baseUrl}get-jammer-chat?${queryParams}`, { withCredentials: true }).pipe(
    map(response => response.data),
  );
}

  sendMessage(chatId: string, sender: any, message: string): Observable<any> {
    const body = { sender, msg: message }; // Construir el cuerpo de la solicitud
    return this.http.post(`${this.baseUrl}send-chat/${chatId}`, body, { withCredentials: true });
}

jammerSendMsg(chatId: string, sender: any, message: string): Observable<any> {
  const body = { sender, msg: message }; // Construir el cuerpo de la solicitud
  return this.http.post(`${this.baseUrl}jammer-sent/${chatId}`, body, { withCredentials: true });
}

}
