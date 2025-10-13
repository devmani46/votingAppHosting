import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { tap, map, switchMap } from 'rxjs/operators';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { SocketService } from './socket.service';

interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
    username: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:4000/api';
  private userKey = 'currentUser';
  private roleKey = 'role';
  private userUpdateSubject = new BehaviorSubject<any>(null);
  public userUpdate$ = this.userUpdateSubject.asObservable();

  constructor(private router: Router, private http: HttpClient, private socketService: SocketService) {}

  login(email: string, password: string, rememberMe: boolean = false): Observable<boolean> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password, rememberMe }, { withCredentials: true }).pipe(
      tap(response => {
        localStorage.setItem(this.userKey, JSON.stringify(response.user));
        localStorage.setItem(this.roleKey, response.user.role);
      }),
      switchMap(response => {
        return this.http.get(`${this.apiUrl}/users/me`, { withCredentials: true }).pipe(
          tap(completeUser => {
            localStorage.setItem(this.userKey, JSON.stringify(completeUser));
          }),
          map(() => true)
        );
      }),
      tap(() => {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          this.socketService.connect();
          if (currentUser.role === 'admin' || currentUser.role === 'moderator') {
            this.router.navigate(['/menu']);
          } else {
            this.router.navigate(['/user-page']);
          }
        }
      })
    );
  }

  register(newUser: any): Observable<boolean> {
    return this.http.post(`${this.apiUrl}/auth/signup`, newUser, { withCredentials: true }).pipe(
      tap(() => {
        this.router.navigate(['/login']);
      }),
      map(() => true)
    );
  }

  logout(): void {
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.roleKey);
    this.socketService.disconnect();

    this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  getCurrentUser(): any {
    const stored = localStorage.getItem(this.userKey);
    return stored ? JSON.parse(stored) : null;
  }

  getRole(): string | null {
    const role = localStorage.getItem(this.roleKey);
    return role;
  }

  getToken(): string | null {
    return null;
  }

  updateUser(updatedUser: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/me`, updatedUser, { withCredentials: true }).pipe(
      tap(response => {
        localStorage.setItem(this.userKey, JSON.stringify(response));
        this.userUpdateSubject.next(response);
      })
    );
  }

  updateUserLocally(userData: any): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
      this.userUpdateSubject.next(updatedUser);
    }
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`, { withCredentials: true });
  }
}


