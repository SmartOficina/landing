import { LandingPageService } from './../../landing-page.service';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-home-section',
    templateUrl: './home-section.component.html',
    styleUrls: ['./home-section.component.scss'],
    standalone: true
})
export class HomeSectionComponent {
  @Input() isMobileView: boolean = false;

  constructor(
    private router: Router,
    private landingPageService: LandingPageService
  ) { }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  scrollToSection(sectionId: string){
    this.landingPageService.scrollToSection(sectionId);
  }
}
