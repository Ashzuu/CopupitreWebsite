import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatMessage, Conversation } from '../model';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MessagingRepository {
  private readonly http = inject(HttpClient);
  private readonly BASE_API_URL = environment.BASE_API_URL;

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.BASE_API_URL}/api/messages/conversations`);
  }

  getMessages(contextType: string, contextId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.BASE_API_URL}/api/messages/${contextType}/${contextId}`);
  }

  sendMessage(contextType: string, contextId: number, content: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.BASE_API_URL}/api/messages/${contextType}/${contextId}`, {
      content,
    });
  }
}
