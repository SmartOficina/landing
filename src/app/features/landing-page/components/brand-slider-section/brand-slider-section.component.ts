import { Component } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
    selector: 'app-brand-slider-section',
    templateUrl: './brand-slider-section.component.html',
    styleUrls: ['./brand-slider-section.component.scss'],
    imports: [NgFor]
})
export class BrandSliderSectionComponent {
  logos: string[] = [
    './',
    './',
    './',
    './',
    './',
    './',
  ];

  trackLogo(index: number, logo: string): string {
    return logo;
  }
}
