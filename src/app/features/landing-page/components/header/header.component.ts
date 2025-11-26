import { AfterViewInit, Component, Input, OnInit, Renderer2 } from "@angular/core";
import { Router } from "@angular/router";
import { LandingPageService } from "../../landing-page.service";
import { NgClass, NgIf } from "@angular/common";
import { Subscription } from "rxjs";
import { AuthService } from "@shared/services/auth.service";
import { environment } from "@environment/environment";

@Component({
  selector: "app-header",
  standalone: true,
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
  imports: [NgClass, NgIf],
})
export class HeaderComponent implements AfterViewInit, OnInit {
  @Input() isMobileView: boolean = false;
  @Input() isScrolled: boolean = false;

  private subscriptions: Subscription[] = [];

  isSubmenuOpen: string | null = null;
  garageInfo: any | null = null;
  submenuTimer: any;
  mobileSubmenuOpen: string | null = null;
  isAuthenticated: boolean = false;

  constructor(
    private landingPageService: LandingPageService,
    private renderer: Renderer2,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkAuthentication();
    this.subscriptions.push(
      this.landingPageService.isAuthenticated$.subscribe((isAuthenticated) => {
        this.isAuthenticated = isAuthenticated;
      })
    );
    this.subscriptions.push(
      this.landingPageService.garageInfo$.subscribe((garageInfo) => {
        this.garageInfo = garageInfo;
      })
    );
  }

  ngAfterViewInit(): void {
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");
    const closeMenuButton = document.querySelector('#mobile-menu button[aria-label="Fechar menu"]');

    if (mobileMenuButton) {
      this.renderer.listen(mobileMenuButton, "click", () => {
        this.toggleMobileMenu();
      });
    }

    if (closeMenuButton) {
      this.renderer.listen(closeMenuButton, "click", () => {
        this.closeMobileMenu();
      });
    }

    this.renderer.listen("document", "click", (event: Event) => {
      const target = event.target as HTMLElement;
      if (mobileMenu && !mobileMenu.contains(target) && mobileMenuButton && !mobileMenuButton.contains(target) && mobileMenu.classList.contains("translate-x-0")) {
        this.closeMobileMenu();
      }
    });
  }

  checkAuthentication(): void {
    const token = localStorage.getItem("token");
    if (token) {
      this.authService.validateToken(token).subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.landingPageService.setAuthState(true, response.body.garage);
          }
        },
        error: () => {
          localStorage.removeItem("token");
          this.landingPageService.setAuthState(false, null);
        },
      });
    } else {
      this.landingPageService.setAuthState(false, null);
    }
  }

  openSubmenu(menu: string): void {
    clearTimeout(this.submenuTimer);
    this.isSubmenuOpen = menu;
  }

  keepSubmenuOpen(): void {
    clearTimeout(this.submenuTimer);
  }

  closeSubmenu(): void {
    this.submenuTimer = setTimeout(() => {
      this.isSubmenuOpen = null;
    }, 200);
  }

  navigateToRegister() {
    this.router.navigate(["/register"]);
    window.scrollTo(0, 0);
  }

  goToHome(): void {
    this.router.navigate(["/"]);
  }

  goToLogin(): void {
    window.location.href = environment.system_url;
  }

  goToSystem(): void {
    window.location.href = environment.system_url + "/dashboard";
  }

  scrollToSection(sectionId: string) {
    this.closeMobileMenu();
    const currentUrl = this.router.url;
    if (currentUrl === "/" || currentUrl === "/home") {
      this.landingPageService.scrollToSection(sectionId);
    } else {
      this.router.navigate(["/"]).then(() => {
        setTimeout(() => {
          this.landingPageService.scrollToSection(sectionId);
        }, 300);
      });
    }
  }

  toggleMobileSubmenu(menu: string): void {
    this.mobileSubmenuOpen = this.mobileSubmenuOpen === menu ? null : menu;
  }

  toggleMobileMenu(): void {
    const mobileMenu = document.getElementById("mobile-menu");
    if (mobileMenu) {
      if (mobileMenu.classList.contains("translate-x-full")) {
        mobileMenu.classList.remove("translate-x-full");
        mobileMenu.classList.add("translate-x-0");
      } else {
        mobileMenu.classList.add("translate-x-full");
        mobileMenu.classList.remove("translate-x-0");
      }
    }
  }

  closeMobileMenu(): void {
    const mobileMenu = document.getElementById("mobile-menu");
    if (mobileMenu) {
      mobileMenu.classList.add("translate-x-full");
      mobileMenu.classList.remove("translate-x-0");
    }
    this.mobileSubmenuOpen = null;
  }

  scrollToSectionAndCloseMenu(sectionId: string): void {
    this.closeMobileMenu();
    this.scrollToSection(sectionId);
  }
}
