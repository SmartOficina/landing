import { Component, AfterViewInit, OnInit, HostListener } from '@angular/core';
import { DatePipe, NgClass, NgFor } from '@angular/common';

interface Section {
  id: string;
  number: number;
  title: string;
}

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss'],
  standalone: true,
  imports: [DatePipe]
})
export class PrivacyPolicyComponent implements OnInit, AfterViewInit {
  currentDate = new Date();
  activeSection: string = 'section1';
  sections: Section[] = [
    { id: 'section1', number: 1, title: 'Informações que coletamos' },
    { id: 'section2', number: 2, title: 'Uso das informações' },
    { id: 'section3', number: 3, title: 'Compartilhamento de informações' },
    { id: 'section4', number: 4, title: 'Armazenamento e segurança' },
    { id: 'section5', number: 5, title: 'Seus direitos' },
    { id: 'section6', number: 6, title: 'Cookies' },
    { id: 'section7', number: 7, title: 'Alterações na política' }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver(): void {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.activeSection = entry.target.id;
          }
        });
      }, { threshold: 0.5 });

      this.sections.forEach(section => {
        const element = document.getElementById(section.id);
        if (element) {
          observer.observe(element);
        }
      });
    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  backToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (!('IntersectionObserver' in window)) {
      for (const section of this.sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            this.activeSection = section.id;
            break;
          }
        }
      }
    }
  }
}