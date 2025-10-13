import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  metadata: Record<string, any>;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiUrl = 'http://localhost:4000/api/notifications';

  constructor(private http: HttpClient) {}

  // Poll every 5 seconds
  getNotifications() {
    console.log('[Frontend] Fetching notifications from API...');
    return this.http
      .get<Notification[]>(`${this.apiUrl}`, {
        withCredentials: true,
      })
      .pipe(
        tap((data) => console.log('[Frontend] Received notifications:', data))
      );
  }
}
