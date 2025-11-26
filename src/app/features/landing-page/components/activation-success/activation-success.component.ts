import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@environment/environment';

@Component({
  selector: 'app-activation-success',
  templateUrl: './activation-success.component.html',
  styleUrls: ['./activation-success.component.scss'],
  standalone: true
})
export class ActivationSuccessComponent implements OnInit, OnDestroy {
  email: string = '';
  private redirectTimeout: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      const token = params['token'];

      if (token) {
        localStorage.setItem('token', token);

        localStorage.setItem('activationSuccess', JSON.stringify({
          email: this.email,
          timestamp: Date.now()
        }));

        this.redirectTimeout = setTimeout(() => {
          this.redirectToSystem();
        }, 2000);
      } else {
        this.router.navigate(['/activation-error']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }

  private redirectToSystem(): void {
    window.location.href = environment.system_url;
  }
}