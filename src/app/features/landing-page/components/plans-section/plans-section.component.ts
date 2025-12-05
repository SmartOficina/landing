import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, EventEmitter } from "@angular/core";
import { Router } from "@angular/router";
import { NgClass, NgFor, NgIf } from "@angular/common";
import { AlertService } from "@shared/services/alert.service";
import { LandingPageService } from "../../landing-page.service";
import { PlansService } from "@shared/services/plans.service";
import { Subscription } from "rxjs";
import { environment } from "@environment/environment";

interface RenewalInfo {
  planId: string;
  planName: string;
  price: number;
  interval?: string;
}

interface ProcessedPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: { name: string; included: boolean }[];
  isCurrentPlan?: boolean;
  isExpired?: boolean;
  renewalInfo?: RenewalInfo;
  originalPermissions?: string[];
  isDowngrade?: boolean;
  isLocked?: boolean;
  pricing?: {
    monthly: {
      price: number;
      interval: string;
      displayText: string;
    };
    annual: {
      price: number;
      savings: number;
      discountPercent: number;
      interval: string;
      displayText: string;
      savingsText: string;
    };
  };
}

@Component({
  selector: "app-plans-section",
  templateUrl: "./plans-section.component.html",
  styleUrls: ["./plans-section.component.scss"],
  imports: [NgFor, NgIf, NgClass],
})
export class PlansSectionComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() isRegistrationMode: boolean = false;
  @Output() planSelected = new EventEmitter<any>();

  isLoading: boolean = false;
  plans: ProcessedPlan[] = [];
  isAuthenticated: boolean = false;
  garageInfo: any = null;
  isFreePlan: boolean = false;
  isAnnualBilling: boolean = false;
  annualDiscountPercent: number = 20;
  minInstallmentPrice: number = 79.9;
  installmentIncrement: number = 19.9;
  maxInstallments: number = 12;
  trialEnabled: boolean = environment.trialEnabled;
  trialDays: number = environment.trialDays;
  private subscriptions: Subscription[] = [];

  // prettier-ignore
  allFeatures: string[] = [
    'Gerenciamento de clientes',
    'Gerenciamento de veículos',
    'Ordens de Serviço',
    'Agendamento',
    'Gerenciamento de Serviços',
    'Controle de estoque',
    'Gestão financeira',
    'Gerenciamento de Mecânicos',
    'Suporte prioritário'
  ];

  // prettier-ignore
  constructor(
    public router: Router,
    private alertService: AlertService,
    private landingPageService: LandingPageService,
    private plansService: PlansService
  ) { }

  ngOnInit(): void {
    this.subscriptions.push(
      this.landingPageService.isAuthenticated$.subscribe((isAuthenticated) => {
        this.isAuthenticated = isAuthenticated;
      })
    );

    this.subscriptions.push(
      this.landingPageService.garageInfo$.subscribe((garageInfo) => {
        this.garageInfo = garageInfo;
        this.updateCurrentPlan();
      })
    );

    this.loadPricingConfig();
    this.loadPlans();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  loadPricingConfig(): void {
    this.plansService.getPricingConfig().subscribe({
      next: (response: any) => {
        if (response.body && response.body.result) {
          this.annualDiscountPercent = response.body.result.annualDiscountPercent;
          this.minInstallmentPrice = response.body.result.minInstallmentPrice;
          this.installmentIncrement = response.body.result.installmentIncrement;
          this.maxInstallments = response.body.result.maxInstallments;
        }
      },
      error: (error) => {},
    });
  }

  get sortedPlans(): ProcessedPlan[] {
    return [...this.plans].sort((a, b) => b.price - a.price);
  }

  get displayPlans(): ProcessedPlan[] {
    const sorted = this.sortedPlans;

    if (sorted.length < 3) {
      return sorted;
    }

    if (sorted.length === 3) {
      return sorted;
    }

    return sorted.slice(0, 3);
  }

  loadPlans(): void {
    this.isLoading = true;
    this.plansService.getPlansWithAnnualOptions().subscribe({
      next: (response: any) => {
        if (response.body && response.body.result) {
          this.plans = this.processApiPlans(response.body.result);
          this.updateCurrentPlan();
        }
        this.isLoading = false;

        setTimeout(() => {
          this.animatePlansOnScroll();
        }, 100);
      },
      error: (error: any) => {
        this.isLoading = false;
      },
    });
  }

  updateCurrentPlan(): void {
    this.plans.forEach((plan) => {
      plan.isCurrentPlan = false;
      plan.isExpired = false;
      plan.renewalInfo = undefined;
      plan.originalPermissions = undefined;
      plan.isDowngrade = false;
    });

    if (!this.isAuthenticated || !this.garageInfo || this.plans.length === 0) {
      return;
    }

    this.isFreePlan = this.garageInfo?.subscription?.plan?.name === "Grátis";

    if (this.garageInfo.subscription) {
      const subscriptionData = this.garageInfo.subscription.subscription;
      const planData = this.garageInfo.subscription.plan;

      if (!subscriptionData || !planData) {
        return;
      }

      const planId = planData.id;
      const isExpired = subscriptionData.isExpired === true || subscriptionData.status === "expired";
      const currentPlan = this.plans.find((plan) => plan._id === planId);

      if (currentPlan) {
        currentPlan.isCurrentPlan = true;
        currentPlan.isExpired = isExpired;

        if (isExpired && subscriptionData.renewalInfo) {
          currentPlan.renewalInfo = {
            planId: subscriptionData.renewalInfo.planId,
            planName: subscriptionData.renewalInfo.planName,
            price: subscriptionData.renewalInfo.price,
            interval: subscriptionData.renewalInfo.interval || "monthly",
          };
        }

        if (planData.originalPermissions) {
          currentPlan.originalPermissions = planData.originalPermissions;
        }

        if (!isExpired) {
          this.plans.forEach((plan) => {
            if (plan._id !== currentPlan._id && plan.price < currentPlan.price) {
              plan.isDowngrade = true;
            }
          });
        }
      }
    }
  }

  processApiPlans(apiPlans: any[]): ProcessedPlan[] {
    return apiPlans.map((plan) => {
      const normalizedFeatures = plan.features.map((feature: string) => {
        if (feature.includes("Agendamento")) return "Agendamento";
        if (feature.includes("Controle de estoque")) return "Controle de estoque";
        return feature;
      });

      const features = this.allFeatures.map((feature) => ({
        name: feature,
        included: normalizedFeatures.includes(feature),
      }));

      return {
        _id: plan._id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        interval: plan.interval || "monthly",
        features,
        isCurrentPlan: false,
        isExpired: false,
        isDowngrade: false,
        isLocked: plan.isLocked || false,
        pricing: plan.pricing || undefined,
      };
    });
  }

  selectPlan(plan: ProcessedPlan): void {
    if (plan.isLocked) {
      this.alertService.showAlert("Plano Bloqueado", "Este plano não está disponível no momento. Por favor, escolha outro plano ou entre em contato com o suporte.", "warning", "Entendi");
      return;
    }

    if (this.isRegistrationMode) {
      const planToEmit = {
        ...plan,
        isAnnual: this.isAnnualBilling,
      };
      this.planSelected.emit(planToEmit);
      return;
    }

    const baseQueryParams: any = {};

    if (this.isAnnualBilling) {
      baseQueryParams.billing = "annual";
    }

    if (this.isAuthenticated) {
      const currentPlan = this.getCurrentPlan();

      if (currentPlan && currentPlan._id === plan._id) {
        if (currentPlan.isExpired) {
          this.router.navigate(["/payment", plan._id], {
            queryParams: { action: "renewal", ...baseQueryParams },
          });
        } else {
          this.alertService.showAlert("Aviso", "Este já é o seu plano atual.", "info", "Fechar");
        }
        return;
      }

      if (plan.isDowngrade) {
        this.alertService.showAlert("Downgrade não permitido", "Não é possível fazer downgrade para um plano inferior enquanto sua assinatura atual estiver ativa. Você poderá escolher este plano após o término da sua assinatura atual.", "warning", "Entendi");
        return;
      }

      if (currentPlan && !this.isFreePlan) {
        const isCurrentPlanExpired = currentPlan.isExpired;
        const currentPlanPrice = this.getCurrentPlanPrice(currentPlan);
        const selectedPlanPrice = this.getCurrentPlanPrice(plan);

        if (selectedPlanPrice > currentPlanPrice) {
          this.router.navigate(["/payment", plan._id], {
            queryParams: {
              action: "upgrade",
              currentPlanId: currentPlan._id,
              currentSubscriptionId: this.getCurrentSubscription()?.id,
              ...baseQueryParams,
            },
          });
        } else if (selectedPlanPrice < currentPlanPrice && !isCurrentPlanExpired) {
          this.alertService.showAlert("Downgrade não permitido", "Não é possível fazer downgrade para um plano inferior enquanto sua assinatura atual estiver ativa.", "warning", "Entendi");
        } else if (isCurrentPlanExpired) {
          this.router.navigate(["/payment", plan._id], {
            queryParams: baseQueryParams,
          });
        }
      } else {
        this.router.navigate(["/payment", plan._id], {
          queryParams: { action: "new", ...baseQueryParams },
        });
      }
    } else {
      this.router.navigate(["/register"], {
        queryParams: { planId: plan._id, ...baseQueryParams },
      });
    }
  }

  getActionButtonText(plan: ProcessedPlan): string {
    if (plan.isLocked) {
      return "Bloqueado";
    }

    if (plan.isCurrentPlan) {
      if (plan.isExpired) {
        return "Renovar Plano";
      } else {
        return "Plano Atual";
      }
    }

    if (plan.isDowngrade) {
      return "Indisponível";
    }

    if (!this.isAuthenticated || this.isFreePlan) {
      return `Assinar ${plan.name}`;
    }

    const currentPlan = this.getCurrentPlan();
    if (currentPlan) {
      if (currentPlan.isExpired) {
        return `Assinar ${plan.name}`;
      } else if (plan.price > currentPlan.price) {
        return "Fazer Upgrade";
      } else if (plan.price < currentPlan.price) {
        return "Indisponível";
      }
    }

    return `Assinar ${plan.name}`;
  }

  getButtonClass(plan: ProcessedPlan): string {
    if (plan.isLocked) {
      return "cursor-not-allowed bg-red-400 opacity-60";
    }

    const currentPlan = this.getCurrentPlan();

    if (plan.isCurrentPlan && !plan.isExpired) {
      return "cursor-default bg-green-500 hover:bg-green-500";
    }

    if (plan.isDowngrade) {
      return "cursor-not-allowed bg-gray-400 opacity-60";
    }

    return "cursor-pointer";
  }

  trackPlan(index: number, plan: any): any {
    return plan._id || index;
  }

  trackFeature(index: number, feature: any): any {
    return feature.name || index;
  }

  animatePlansOnScroll(): void {
    const cards = document.querySelectorAll(".plan-card");

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                entry.target.classList.add("animated");
              }, i * 150);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      cards.forEach((card) => {
        observer.observe(card);
      });
    } else {
      cards.forEach((card, i) => {
        setTimeout(() => {
          card.classList.add("animated");
        }, i * 150);
      });
    }
  }

  getCurrentPlan(): any {
    if (!this.isAuthenticated || !this.garageInfo || !this.garageInfo.subscription) {
      return null;
    }

    const planId = this.garageInfo.subscription.plan?.id;
    return this.plans.find((plan) => plan._id === planId) || null;
  }

  getCurrentSubscription(): any {
    if (!this.isAuthenticated || !this.garageInfo || !this.garageInfo.subscription) {
      return null;
    }

    return this.garageInfo.subscription.subscription;
  }

  getInstallmentText(price: number): string {
    if (price < this.installmentIncrement) {
      return "Cobrado mensalmente";
    }

    const maxInstallmentsByValue = Math.floor(price / this.installmentIncrement);

    const installments = Math.min(maxInstallmentsByValue, this.maxInstallments);

    if (installments <= 1) {
      return "Cobrado mensalmente";
    }

    const installmentValue = (price / installments).toFixed(2).replace(".", ",");
    return `Parcele em até ${installments}x de R$ ${installmentValue}`;
  }

  /**
   * Alterna entre visualização mensal e anual
   */
  toggleBillingPeriod(): void {
    this.isAnnualBilling = !this.isAnnualBilling;
  }

  /**
   * Obtém o preço atual do plano baseado na visualização selecionada
   */
  getCurrentPlanPrice(plan: ProcessedPlan): number {
    if (this.isAnnualBilling && plan.pricing?.annual) {
      return plan.pricing.annual.price;
    }
    return plan.pricing?.monthly?.price || plan.price;
  }

  /**
   * Obtém o texto de exibição do intervalo (mensal/anual)
   */
  getCurrentPlanInterval(plan: ProcessedPlan): string {
    if (this.isAnnualBilling && plan.pricing?.annual) {
      return plan.pricing.annual.displayText;
    }
    return plan.pricing?.monthly?.displayText || "/mês";
  }

  /**
   * Obtém o texto de economia para planos anuais
   */
  getSavingsText(plan: ProcessedPlan): string {
    if (this.isAnnualBilling && plan.pricing?.annual) {
      return plan.pricing.annual.savingsText;
    }
    return "";
  }

  /**
   * Verifica se deve mostrar o texto de economia
   */
  shouldShowSavings(plan: ProcessedPlan): boolean {
    return this.isAnnualBilling && !!plan.pricing?.annual?.savings;
  }

  getAnnualInstallmentInfo(plan: ProcessedPlan): { installments: number; value: number } | null {
    if (!this.isAnnualBilling || !plan.pricing?.annual) {
      return null;
    }

    const annualPrice = plan.pricing.annual.price;

    if (annualPrice <= this.minInstallmentPrice) {
      return null;
    }

    const installments = Math.min(Math.floor(annualPrice / this.minInstallmentPrice), this.maxInstallments);

    if (installments <= 1) {
      return null;
    }

    const installmentValue = annualPrice / installments;
    return { installments, value: installmentValue };
  }
}
