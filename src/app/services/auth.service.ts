import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth/login';

  constructor(private http: HttpClient) {}

  login(credentials: { correo: string; contrasena: string }): Observable<any> {
    return this.http.post(this.apiUrl, credentials);
  }

  guardarToken(token: string): void {
    localStorage.setItem('jwt_token', token);
  }

  obtenerToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  cerrarSesion(): void {
    localStorage.removeItem('jwt_token');
  }
}
