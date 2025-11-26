import { environment } from '@environment/environment';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {

  constructor(
    private http: HttpClient
  ) { }

  createGarage(params: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/garage/create`, params, { observe: 'response' });
  }

  checkPhone(phone: string): Observable<{ exists: boolean }> {
    return this.http.post<{ exists: boolean }>(`${environment.api_server}/api/garage/check-phone`, { phone });
  }

  checkEmail(email: string): Observable<{ exists: boolean }> {
    return this.http.post<{ exists: boolean }>(`${environment.api_server}/api/garage/check-email`, { email });
  }

  checkCnpjCpf(cnpjCpf: string): Observable<{ exists: boolean }> {
    return this.http.post<{ exists: boolean }>(`${environment.api_server}/api/garage/check-cnpj-cpf`, { cnpjCpf });
  }

  savePartialData(data: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/garage/save-partial`, data, { observe: 'response' });
  }

  searchZipCode(zipCode: string): Observable<any> {
    return this.http.get<any>(`https://brasilapi.com.br/api/cep/v2/${zipCode}`);
  }

  sendActivationEmail(garageId: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/garage/send-activation-email`, { garageId }, { observe: 'response' });
  }
}