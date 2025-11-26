import { Router } from '@angular/router';
import { LandingPageService } from './../../landing-page.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true
})
export class FooterComponent {

  constructor(
    private landingPageService: LandingPageService,
    private router: Router
  ) { }

  scrollToSection(sectionId: string) {
    this.landingPageService.scrollToSection(sectionId);
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  navigateToBlank(router: string): void {
    window.open(`/${router}`, '_blank');
  }

  navigateTo(router: string): void {
    this.router.navigate([`/${router}`]);
  }

}
