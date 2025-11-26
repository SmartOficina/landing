import { LandingPageService } from './landing-page.service';
import { Component, OnInit, HostListener, OnDestroy, AfterViewInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { HomeSectionComponent } from './components/home-section/home-section.component';
import { FeaturesSectionComponent } from './components/features-section/features-section.component';

import { PlansSectionComponent } from './components/plans-section/plans-section.component';
import { ContactSectionComponent } from './components/contact-section/contact-section.component';
import { FooterComponent } from './components/footer/footer.component';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
  imports: [
    NgIf,
    HeaderComponent,
    HomeSectionComponent,
    FeaturesSectionComponent,
    PlansSectionComponent,
    ContactSectionComponent,
    FooterComponent
  ]
})
export class LandingPageComponent implements OnInit, OnDestroy, AfterViewInit {
  isScrolled: boolean = false;
  isMobileView: boolean = false;
  isPageLoading: boolean = false;
  private scrollThreshold: number = 50;
  private routerSubscription: Subscription;

  constructor(
    private router: Router,
    private landingPageService: LandingPageService,
    private route: ActivatedRoute
  ) {
    this.routerSubscription = this.router.events
      .pipe(
        filter(
          event =>
            event instanceof NavigationStart ||
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError
        )
      )
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.isPageLoading = true;
        } else {
          setTimeout(() => {
            this.isPageLoading = false;
          }, 500);
        }
      });
  }

  ngOnInit(): void {
    this.checkScreenSize();

    this.isScrolled = window.scrollY > this.scrollThreshold;

    this.updateBackToTopButton();

    this.setupSmoothScroll();

    this.setupScrollAnimations();
  }

  ngAfterViewInit(): void {
    const hasPlansParam = this.route.snapshot.queryParamMap.has('plans');
    if (hasPlansParam) {
      setTimeout(() => {
        this.landingPageService.scrollToSection('pricing');
        this.router.navigate([], {
          queryParams: { plans: null },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      }, 200);
    }
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > this.scrollThreshold;

    this.updateBackToTopButton();
  }

  @HostListener('window:resize', [])
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobileView = window.innerWidth < 1024;
  }

  private updateBackToTopButton(): void {
    const backToTopBtn = document.querySelector('.back-to-top') as HTMLElement;
    if (backToTopBtn) {
      if (window.scrollY > 500) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }
  }

  private setupSmoothScroll(): void {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();

        const target = document.querySelector((anchor as HTMLAnchorElement).getAttribute('href') || '');
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth'
          });
        }
      });
    });
  }

  private setupScrollAnimations(): void {
    if ('IntersectionObserver' in window) {
      const fadeElements = document.querySelectorAll('.fade-in-element');

      const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -100px 0px"
      };

      const appearOnScroll = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add('appear');
            observer.unobserve(entry.target);
          });
        },
        appearOptions
      );

      fadeElements.forEach(element => {
        appearOnScroll.observe(element);
      });
    }
  }
}