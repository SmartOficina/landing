import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LandingPageService {

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private garageInfoSubject = new BehaviorSubject<any | null>(null);
  public garageInfo$ = this.garageInfoSubject.asObservable();

  constructor(
  ) { }

  setAuthState(isAuthenticated: boolean, garageInfo: any | null): void {
    this.isAuthenticatedSubject.next(isAuthenticated);
    this.garageInfoSubject.next(garageInfo);
  }

  public get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  public get garageInfo(): any | null {
    return this.garageInfoSubject.value;
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 60;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}
