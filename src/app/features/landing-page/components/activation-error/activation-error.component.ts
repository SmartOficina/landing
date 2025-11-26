import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-activation-error',
  templateUrl: './activation-error.component.html',
  styleUrls: ['./activation-error.component.scss'],
  standalone: true,
  imports: []
})
export class ActivationErrorComponent implements OnInit {
  errorMessage: string = 'Ocorreu um erro durante a ativação da conta.';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.errorMessage = decodeURIComponent(params['message']);
      }
    });
  }

  goToRegistration(): void {
    this.router.navigate(['/register']);
  }

  goToLogin(): void {
    this.router.navigate(['/system/login']);
  }

  goToHomePage(): void {
    this.router.navigate(['/']);
  }
}