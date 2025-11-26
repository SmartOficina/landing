import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environment/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.api_server;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  validateToken(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/auth/token`, {
      headers: { Authorization: `Bearer ${token}` },
      observe: 'response'
    });
  }

  garageAuthenticate(email: string, password: string, isNewGarage: boolean = false): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/login`, {
      email,
      password,
      isNewGarage
    }, { observe: 'response' });
  }

  autoLogin(response: any, isFromActivation: boolean = false): void {
    const token = response.body?.token || response.token;
    const garage = response.body?.garage || response.garage;

    if (token) {
      localStorage.setItem('token', token);
      if (garage) {
        localStorage.setItem('garageInfo', JSON.stringify(garage));
      }

      // Redirecionar para o sistema
      if (isFromActivation) {
        window.location.href = environment.system_url + '/dashboard';
      } else {
        window.location.href = environment.system_url;
      }
    }
  }
}
