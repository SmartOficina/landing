import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-features-section',
    templateUrl: './features-section.component.html',
    styleUrls: ['./features-section.component.scss'],
    standalone: true
})
export class FeaturesSectionComponent {

    constructor(
        private router: Router
    ) { }

    navigateToRegister(): void {
        this.router.navigate(['/register']);
    }
}