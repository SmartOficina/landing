import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { FooterComponent } from '../footer/footer.component';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { RegistrationService } from './registration.service';
import { AlertService } from '@shared/services/alert.service';
import { InputGenericComponent } from '@shared/components/input-generic/input-generic.component';
import { AuthService } from '@shared/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { PaymentComponent } from '../payment/payment.component';
import { LandingPageService } from '../../landing-page.service';
import { RegistrationTokenService } from '@shared/services/registration-token.service';
import { CouponService } from '@shared/services/coupon.service';
import { PaymentService } from '@shared/services/payment.service';
import { Subscription } from 'rxjs';
import { PlansSectionComponent } from '../plans-section/plans-section.component';
import { environment } from '@environment/environment';


@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
  imports: [
    NgIf,
    NgFor,
    NgClass,
    HeaderComponent,
    FormsModule,
    FooterComponent,
    InputGenericComponent,
    PaymentComponent,
    PlansSectionComponent
  ]
})
export class RegistrationComponent implements OnInit, OnDestroy {
  @ViewChild('registrationForm') registrationForm!: NgForm;

  currentStep: number = 1;
  isLoading: boolean = false;
  submitted: boolean = false;
  isMobileView: boolean = false;

  garage: any = {
    name: '',
    cnpjCpf: '',
    phone: '',
    email: '',
    password: '',
    address: {
      street: '',
      number: '',
      district: '',
      city: '',
      state: '',
      zipCode: ''
    }
  };

  steps = [
    { name: 'Cadastro' },
    { name: 'Pagamento' }
  ];

  selectedPlan: any = null;
  garageInfo: any = null;
  isAnnualBilling: boolean = false;
  
  private subscriptions: Subscription[] = [];


  duplicateEmail: boolean = false;
  duplicatePhone: boolean = false;
  duplicateCnpjCpf: boolean = false;

  constructor(
    private authService: AuthService,
    private registrationService: RegistrationService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private landingPageService: LandingPageService,
    private registrationTokenService: RegistrationTokenService,
    private couponService: CouponService,
    private paymentService: PaymentService
  ) { }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.checkForSelectedPlan();
    this.checkForCoupon();
  }

  getProgressWidth(): string {
    const totalSteps = this.steps.length;
    if (totalSteps <= 1) return '0%';
    
    let progress = (this.currentStep - 1) / (totalSteps - 1) * 100;
    
    if (totalSteps === 2 && this.currentStep === 2) {
      progress = 85;
    }
    
    return `${Math.min(progress, 100)}%`;
  }

  private isBasicDataValid(): boolean {
    this.submitted = true;

    const nameValid = this.garage.name && this.garage.name.trim().length >= 4;
    const emailValid = this.garage.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.garage.email) && !this.duplicateEmail;
    const passwordValid = this.garage.password && this.garage.password.trim().length >= 6;
    const phoneDigits = this.garage.phone ? this.garage.phone.replace(/\D/g, '') : '';
    const phoneValid = (phoneDigits.length === 10 || phoneDigits.length === 11) && !this.duplicatePhone;
    const cnpjCpfDigits = this.garage.cnpjCpf ? this.garage.cnpjCpf.replace(/\D/g, '') : '';
    const cnpjCpfValid = (cnpjCpfDigits.length === 11 || cnpjCpfDigits.length === 14) && !this.duplicateCnpjCpf;

    return nameValid && emailValid && passwordValid && phoneValid && cnpjCpfValid;
  }


  goToNextStep(): void {
    if (this.currentStep === 1 && this.isBasicDataValid()) {
      this.register();
    }
  }


  register(): void {
    this.isLoading = true;
    this.registrationService.createGarage(this.garage).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        
        const garageData = response.body?.result || response.body?.garage || response.result;
        
        
        if (garageData && garageData._id) {
          this.garageInfo = garageData;
          
          if (response.body?.token) {
            this.registrationTokenService.setTemporaryToken(response.body.token);
          }
          
          // Verificar se há cupom e buscar plano automaticamente
          const couponCode = this.couponService.getCouponCode();
          
          if (couponCode) {
            // Aguardar um pouco para garantir que o token foi definido
            setTimeout(() => {
              this.fetchPlanFromCoupon(couponCode);
            }, 100);
          } else {
            this.currentStep = 2;
            window.scrollTo(0, 0);
          }
        } else {
          this.alertService.showAlert('Erro', 'Erro ao processar resposta do servidor. Tente novamente.', 'error', 'Entendi');
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.alertService.showAlert('Erro ao criar garagem', error.error?.msg || 'Verifique os dados e tente novamente', 'error', 'Entendi');
      }
    });
  }

  onDuplicateEmail(duplicate: boolean): void {
    this.duplicateEmail = duplicate;
  }

  onDuplicatePhone(duplicate: boolean): void {
    this.duplicatePhone = duplicate;
  }

  onDuplicateCnpjCpf(duplicate: boolean): void {
    this.duplicateCnpjCpf = duplicate;
  }

  activateAccount(response: any): void {
    if (response.status === 200) {
      this.authService.autoLogin(response, true);
    }
  }

  navigateToLogin(): void {
    window.location.href = environment.system_url;
  }

  goToHomePage(): void {
    this.router.navigate(['/']);
  }

  checkForSelectedPlan(): void {
    const queryParams = this.route.snapshot.queryParams;
    if (queryParams['planId']) {
      this.selectedPlan = { _id: queryParams['planId'] };
      this.isAnnualBilling = queryParams['billing'] === 'annual';
    }
  }

  checkForCoupon(): void {
    const queryParams = this.route.snapshot.queryParams;
    
    if (queryParams['coupon']) {
      const couponCode = queryParams['coupon'];
      this.couponService.setCouponCode(couponCode);
    } else {
      // Tentar capturar diretamente da URL atual
      const currentUrl = this.router.url;
      const urlParams = new URLSearchParams(currentUrl.split('?')[1] || '');
      const couponFromUrl = urlParams.get('coupon');
      
      if (couponFromUrl) {
        this.couponService.setCouponCode(couponFromUrl);
      }
    }
  }

  fetchPlanFromCoupon(couponCode: string): void {
    // Para os cupons específicos que criamos, sabemos os planIds
    const couponPlanMapping: { [key: string]: { planId: string, interval: string } } = {
      'PLANO1-MENSAL': { planId: '67ce3f502ccd1b7387544ca7', interval: 'monthly' },
      'PLANO1-ANUAL': { planId: '67ce3f502ccd1b7387544ca7', interval: 'yearly' },
      'PLANO2-MENSAL': { planId: '67ce3f502ccd1b7387544ca8', interval: 'monthly' },
      'PLANO2-ANUAL': { planId: '67ce3f502ccd1b7387544ca8', interval: 'yearly' }
    };

    const mapping = couponPlanMapping[couponCode.toUpperCase()];
    
    if (mapping) {
      // Usar mapeamento direto para os cupons conhecidos
      this.selectedPlan = { _id: mapping.planId };
      this.isAnnualBilling = mapping.interval === 'yearly';
      
      this.currentStep = 2;
      window.scrollTo(0, 0);
    } else {
      // Tentar API para outros cupons
      this.paymentService.getPlanForCoupon(couponCode, true).subscribe({
        next: (response: any) => {
          if (response.body && response.body.result) {
            const plan = response.body.result;
            this.selectedPlan = { _id: plan._id };
            
            this.validateCouponAndSetBilling(couponCode, plan._id);
          } else {
            this.currentStep = 2;
            window.scrollTo(0, 0);
          }
        },
        error: (error: any) => {
          this.currentStep = 2;
          window.scrollTo(0, 0);
        }
      });
    }
  }

  validateCouponAndSetBilling(couponCode: string, planId: string): void {
    // Testar primeiro com monthly
    this.paymentService.validateCoupon(couponCode, planId, 'monthly', true).subscribe({
      next: (response: any) => {
        if (response.valid) {
          this.isAnnualBilling = false;
        }
        this.currentStep = 2;
        window.scrollTo(0, 0);
      },
      error: () => {
        // Se monthly falhar, testar yearly
        this.paymentService.validateCoupon(couponCode, planId, 'yearly', true).subscribe({
          next: (response: any) => {
            if (response.valid) {
              this.isAnnualBilling = true;
            }
            this.currentStep = 2;
            window.scrollTo(0, 0);
          },
          error: () => {
            // Se ambos falharem, usar padrão monthly
            this.isAnnualBilling = false;
            this.currentStep = 2;
            window.scrollTo(0, 0);
          }
        });
      }
    });
  }

  continueWithoutSubscription(): void {
    this.registrationTokenService.clearTemporaryToken();
    
    
    if (this.steps.length === 2) {
      this.steps.push({ name: 'Ativação' });
    }
    this.currentStep = 3;
    this.isLoading = true; // Show loading on activation step
    window.scrollTo(0, 0);
    
    let garageId = null;
    
    if (this.garageInfo && this.garageInfo._id) {
      garageId = this.garageInfo._id;
    } else {
      const currentUser = this.landingPageService.garageInfo;
      if (currentUser && currentUser._id) {
        garageId = currentUser._id;
        this.garageInfo = currentUser; // Update garageInfo for consistency
      }
    }
    
    
    if (garageId) {
      
      this.registrationService.sendActivationEmail(garageId).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          
        },
        error: (error: any) => {
          this.isLoading = false;
          
          this.alertService.showAlert(
            'Aviso', 
            'Houve um problema ao enviar o e-mail de ativação automaticamente, mas você pode solicitar o reenvio na tela de login.', 
            'warning', 
            'Entendi'
          );
        }
      });
    } else {
      this.isLoading = false;
      
      this.alertService.showAlert(
        'Aviso', 
        'Não foi possível enviar o e-mail de ativação automaticamente. Você pode solicitar o reenvio na tela de login.', 
        'warning', 
        'Entendi'
      );
    }
  }


  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onPaymentCompleted(response: any): void {
    this.registrationTokenService.clearTemporaryToken();
    
    
    
    if (this.garageInfo && this.garageInfo.email && this.garage.password) {
      this.authService.garageAuthenticate(this.garageInfo.email, this.garage.password, true).subscribe({
        next: (loginResponse: any) => {
          if (loginResponse.status === 200) {
            this.authService.autoLogin(loginResponse, false);
            
            this.alertService.showAlert('Sucesso!', 'Pagamento realizado com sucesso! Sua conta foi ativada automaticamente.', 'success', 'Acessar sistema').then(() => {
              window.location.href = environment.system_url;
            });
          } else {
            this.alertService.showAlert('Sucesso!', 'Pagamento realizado com sucesso! Sua conta foi ativada. Faça login para continuar.', 'success', 'Fazer login').then(() => {
              window.location.href = environment.system_url;
            });
          }
        },
        error: () => {
          this.alertService.showAlert('Sucesso!', 'Pagamento realizado com sucesso! Sua conta foi ativada. Faça login para continuar.', 'success', 'Fazer login').then(() => {
            window.location.href = environment.system_url;
          });
        }
      });
    } else {
      this.alertService.showAlert('Sucesso!', 'Pagamento realizado com sucesso! Sua conta foi ativada. Faça login para continuar.', 'success', 'Fazer login').then(() => {
        window.location.href = environment.system_url;
      });
    }
  }

  onPlanSelected(plan: any): void {
    this.selectedPlan = plan;
    this.isAnnualBilling = plan.isAnnual || false;
    
    window.scrollTo(0, 0);
  }

  changePlan(): void {
    this.selectedPlan = null;
    window.scrollTo(0, 0);
  }

}