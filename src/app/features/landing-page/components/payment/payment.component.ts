import { AuthService } from "@shared/services/auth.service";
import { LandingPageService } from "./../../landing-page.service";
import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewInit, Input, Output, EventEmitter } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { NgIf, NgFor, NgClass } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AlertService } from "@shared/services/alert.service";
import { InputGenericComponent } from "@shared/components/input-generic/input-generic.component";
import { PlansService } from "@shared/services/plans.service";
import { PaymentService } from "@shared/services/payment.service";
import { CardsService } from "@shared/services/cards.service";
import { CouponService } from "@shared/services/coupon.service";
import { FooterComponent } from "../footer/footer.component";
import { HeaderComponent } from "../header/header.component";
import { Subscription, Observable, interval, take, filter } from "rxjs";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";

interface Card {
  id: string;
  lastFourDigits: string;
  cardBrand: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  displayName: string;
}

interface InstallmentOption {
  value: number;
  label: string;
  amount: number;
}

enum PlanChangeType {
  UPGRADE = "upgrade",
  RENEWAL = "renewal",
  NEW = "new",
}

enum PaymentMethod {
  CREDIT_CARD = "credit_card",
  PIX = "pix",
}

@Component({
  selector: "app-payment",
  templateUrl: "./payment.component.html",
  styleUrls: ["./payment.component.scss"],
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, HeaderComponent, FooterComponent, InputGenericComponent],
})
export class PaymentComponent implements OnInit, OnDestroy {
  @ViewChild("cardNumberInput") cardNumberInput!: InputGenericComponent;
  @ViewChild("cardNameInput") cardNameInput!: InputGenericComponent;
  @ViewChild("cardExpiryInput") cardExpiryInput!: InputGenericComponent;
  @ViewChild("cardCvvInput") cardCvvInput!: InputGenericComponent;

  private subscriptions: Subscription[] = [];
  private pixStatusCheckInterval: any;
  private processingMessages: string[] = [
    "Estamos processando seu pagamento...",
    "Validando suas informações de forma segura...",
    "Conectando com o servidor de pagamentos...",
    "Quase lá! Estamos finalizando seu pedido...",
    "Estabelecendo conexão segura com o gateway de pagamento..."
  ];

  currentMessageIndex: number = 0;
  processingMessage: string = "";

  Object = Object;
  PaymentMethod = PaymentMethod;
  PlanChangeType = PlanChangeType;

  @Input() isRegistrationMode: boolean = false;
  @Input() registrationGarageInfo: any = null;
  @Input() preselectedPlanId: string | null = null;
  @Input() preselectedBilling: string | null = null;
  @Input() showChangePlanButton: boolean = false;

  @Output() paymentCompleted = new EventEmitter<any>();
  @Output() continueWithoutSubscription = new EventEmitter<void>();
  @Output() changePlanRequested = new EventEmitter<void>();

  plan: any = null;
  isPageLoading: boolean = true;
  isButtonLoading: boolean = false;
  garageInfo: any = null;
  isRenewal: boolean = false;
  isDowngradeAttempt: boolean = false;
  isAnnualBilling: boolean = false;
  annualDiscount: number = 20;
  minInstallmentPrice: number = 79.9;
  installmentIncrement: number = 19.9;
  maxInstallmentsConfig: number = 12;

  planChangeType: PlanChangeType = PlanChangeType.NEW;
  currentSubscription: any = null;
  currentPlan: any = null;
  proRatedCredit: number = 0;
  totalCredit: number = 0;
  amountToPay: number = 0;
  shouldRequirePayment: boolean = true;

  selectedPaymentMethod: PaymentMethod = PaymentMethod.CREDIT_CARD;

  cardNumber: string = "";
  cardName: string = "";
  cardExpiry: string = "";
  cardCvv: string = "";
  saveCard: boolean = true;

  savedCards: Card[] = [];
  selectedCardId: string = "";

  pixQrCode: string = "";
  pixCode: string = "";
  pixExpirationDate: Date | null = null;
  pixPaymentId: string = "";
  pixIsProcessing: boolean = false;

  selectedInstallment: number = 1;
  installmentOptions: InstallmentOption[] = [];
  installmentValue: number = 0;

  couponCode: string = "";
  couponError: string = "";
  couponValidated: boolean = false;
  validatingCoupon: boolean = false;
  couponInfo: any = null;
  planForCoupon: any = null;

  constructor(public router: Router, private route: ActivatedRoute, private alertService: AlertService, private plansService: PlansService, private paymentService: PaymentService, private cardsService: CardsService, private landingPageService: LandingPageService, private authService: AuthService, private sanitizer: DomSanitizer, private couponService: CouponService) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.loadPricingConfig();
    
    if (this.isRegistrationMode) {
      this.initializeRegistrationMode();
      this.checkForStoredCoupon();
    } else {
      this.checkAuthentication();

      const queryParams = this.route.snapshot.queryParams;
      if (queryParams["coupon"]) {
        this.couponCode = queryParams["coupon"];

        this.subscriptions.push(
          interval(500)
            .pipe(
              filter(() => this.plan !== null && !this.isPageLoading),
              take(1)
            )
            .subscribe(() => {
              this.validateCoupon();
            })
        );
      }
    }
  }

  loadPricingConfig(): void {
    this.plansService.getPricingConfig().subscribe({
      next: (response: any) => {
        if (response.body && response.body.result) {
          this.annualDiscount = response.body.result.annualDiscountPercent;
          this.minInstallmentPrice = response.body.result.minInstallmentPrice;
          this.installmentIncrement = response.body.result.installmentIncrement;
          this.maxInstallmentsConfig = response.body.result.maxInstallments;
        }
      },
      error: (error) => {
      },
    });
  }

  initializeRegistrationMode(): void {
    this.garageInfo = this.registrationGarageInfo;
    this.planChangeType = PlanChangeType.NEW;
    
    if (this.preselectedBilling === 'annual') {
      this.isAnnualBilling = true;
    }
    
    if (this.preselectedPlanId) {
      this.loadSpecificPlan(this.preselectedPlanId);
    } else {
      this.loadAllPlansForSelection();
    }
  }

  loadSpecificPlan(planId: string): void {
    this.isPageLoading = true;
    this.plansService.getPlanById(planId).subscribe({
      next: (response: any) => {
        this.plan = response.body.result;
        this.applyBillingToPlan();
        this.generateInstallmentOptions();
        this.calculateInstallmentValue();
        this.isPageLoading = false;
      },
      error: (error) => {
        this.isPageLoading = false;
        this.loadAllPlansForSelection();
      }
    });
  }

  loadAllPlansForSelection(): void {
    this.isPageLoading = false;
  }


  applyBillingToPlan(): void {
    if (!this.plan) return;
    
    if (this.isAnnualBilling) {
      this.plan.originalPrice = this.plan.price;
      this.plan.price = this.calculateAnnualPrice(this.plan.price);
      this.plan.interval = "yearly";
      this.plan.isAnnual = true;
      this.plan.annualSavings = this.calculateAnnualSavings(this.plan.originalPrice);
    }
    
    this.plan.maxInstallments = this.calculateMaxInstallments(this.plan.price);
  }

  checkAuthentication(): void {
    const token = localStorage.getItem("token");
    if (!token) {
      this.redirectToRegister();
      return;
    }

    this.loadSavedCards();
    this.loadPlan();

    this.authService.validateToken(token).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.landingPageService.setAuthState(true, response.body.garage);
          this.initializeComponent();
        } else {
          this.redirectToRegister();
        }
      },
      error: () => {
        localStorage.removeItem("token");
        this.redirectToRegister();
      },
    });
  }

  redirectToRegister(): void {
    this.router.navigate(["/register"]);
  }

  initializeComponent(): void {
    this.subscriptions.push(
      this.landingPageService.garageInfo$.subscribe((garageInfo) => {
        if (garageInfo) {
          this.garageInfo = garageInfo;
          if (this.garageInfo?.subscription?.subscription) {
            this.currentSubscription = this.garageInfo.subscription.subscription;
            this.currentPlan = this.garageInfo.subscription.plan;

            const queryParams = this.route.snapshot.queryParams;
            const action = queryParams["action"] || "new";
            if (action == "renewal") {
              this.checkIfRenewal();
            }

            this.checkIfDowngrade();
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    if (this.pixStatusCheckInterval) {
      clearInterval(this.pixStatusCheckInterval);
    }
  }

  loadSavedCards(): void {
    this.cardsService.getCards().subscribe({
      next: (response: any) => {
        if (response.body && response.body.result) {
          this.savedCards = response.body.result;

          const defaultCard = this.savedCards.find((card) => card.isDefault);
          if (defaultCard) {
            this.selectedCardId = defaultCard.id;
          } else if (this.savedCards.length > 0) {
            this.selectedCardId = this.savedCards[0].id;
          }
        }
      },
      error: (error) => {
      },
    });
  }

  setDefaultCard(cardId: string): void {
    this.isButtonLoading = true;
    this.cardsService.setDefaultCard(cardId).subscribe({
      next: (response: any) => {
        this.loadSavedCards();
        this.alertService.showAlert("Sucesso", "Cartão definido como padrão com sucesso.", "success", "Fechar");
        this.isButtonLoading = false;
      },
      error: (error) => {
        this.isButtonLoading = false;
        this.alertService.showAlert("Erro", "Não foi possível definir o cartão como padrão.", "error", "Fechar");
      },
    });
  }

  deleteCard(cardId: string): void {
    this.alertService.showAlert("Confirmação", "Tem certeza que deseja remover este cartão?", "warning", "Sim, remover", "Cancelar").then((confirmed: boolean) => {
      if (confirmed) {
        this.isButtonLoading = true;
        this.cardsService.deleteCard(cardId).subscribe({
          next: (response: any) => {
            if (this.selectedCardId === cardId) {
              this.selectedCardId = "";
            }

            this.loadSavedCards();
            this.alertService.showAlert("Sucesso", "Cartão removido com sucesso.", "success", "Fechar");
            this.isButtonLoading = false;
          },
          error: (error) => {
            this.isButtonLoading = false;
            this.alertService.showAlert("Erro", "Não foi possível remover o cartão.", "error", "Fechar");
          },
        });
      }
    });
  }

  checkIfDowngrade(): void {
    if (this.plan && this.currentPlan && this.currentSubscription) {
      if (this.currentPlan && this.currentPlan.name === "Grátis") {
        this.planChangeType = PlanChangeType.NEW;
        return;
      }

      const isCurrentPlanExpired = this.currentSubscription.isExpired === true || this.currentSubscription.status === "expired";

      if (!isCurrentPlanExpired) {
        if (this.plan.price < this.getCurrentSubscriptionPlanPrice()) {
          this.isDowngradeAttempt = true;
        } else if (this.plan.price > this.getCurrentSubscriptionPlanPrice()) {
          this.planChangeType = PlanChangeType.UPGRADE;
          this.calculateUpgradePreview();
        }
      }
    }
  }

  checkIfRenewal(): void {
    if (this.garageInfo && this.plan) {
      if (this.garageInfo.subscription && this.garageInfo.subscription.subscription && this.garageInfo.subscription.plan) {
        const subscriptionData = this.garageInfo.subscription.subscription;
        const planData = this.garageInfo.subscription.plan;

        this.isRenewal = planData.id === this.plan._id && (subscriptionData.isExpired === true || subscriptionData.status === "expired");
        if (this.isRenewal) {
          this.planChangeType = PlanChangeType.RENEWAL;
        }
      }
    }
  }

  calculateUpgradePreview(): void {
    if (!this.currentSubscription || !this.currentPlan || !this.plan) {
      return;
    }

    this.isPageLoading = true;

    const previewData = {
      garageId: this.garageInfo._id,
      newPlanId: this.plan._id,
      currentSubscriptionId: this.currentSubscription.id,
      changeType: "upgrade",
      interval: this.isAnnualBilling ? "yearly" : "monthly",
    };

    this.paymentService.previewPlanChange(previewData).subscribe({
      next: (response: any) => {
        if (response.body.isAllowed === false) {
          this.alertService.showAlert("Aviso", response.body.msg || "Esta alteração de plano não é permitida.", "warning", "Entendi").then(() => {
            this.router.navigate(["/"]);
          });
          this.isPageLoading = false;
          return;
        }

        const preview = response.body;

        this.proRatedCredit = preview.proRatedCredit || 0;
        this.totalCredit = preview.totalCredit || this.proRatedCredit;
        this.amountToPay = preview.amountToPay;
        this.shouldRequirePayment = preview.shouldCharge;

        if (this.shouldRequirePayment) {
          this.generateInstallmentOptions(this.amountToPay);
        }

        this.isPageLoading = false;
      },
      error: (error) => {
        this.isPageLoading = false;
        this.alertService.showAlert("Erro", "Não foi possível calcular o valor do upgrade. Tente novamente.", "error", "Fechar");
      },
    });
  }

  loadPlan(): void {
    const planId = this.route.snapshot.paramMap.get("id");
    if (!planId) {
      this.alertService.showAlert("Erro", "Plano não encontrado.", "error", "Fechar");
      this.router.navigate(["/"]);
      return;
    }

    const queryParams = this.route.snapshot.queryParams;
    this.isAnnualBilling = queryParams["billing"] === "annual";

    this.isPageLoading = true;
    this.plansService.getPlanById(planId).subscribe({
      next: (response: any) => {
        this.plan = response.body.result;

        if (this.isAnnualBilling) {
          this.plan.originalPrice = this.plan.price;
          this.plan.price = this.calculateAnnualPrice(this.plan.price);
          this.plan.interval = "yearly";
          this.plan.isAnnual = true;
          this.plan.annualSavings = this.calculateAnnualSavings(this.plan.originalPrice);
        }

        this.plan.maxInstallments = this.calculateMaxInstallments(this.plan.price);

        this.generateInstallmentOptions();
        this.calculateInstallmentValue();

        this.checkIfDowngrade();

        this.isPageLoading = false;
      },
      error: (error) => {
        this.isPageLoading = false;
        this.router.navigate(["/"]);
      },
    });
  }

  calculateAnnualPrice(monthlyPrice: number): number {
    const yearlyPrice = monthlyPrice * 12;
    const discount = (yearlyPrice * this.annualDiscount) / 100;
    return parseFloat((yearlyPrice - discount).toFixed(2));
  }

  calculateAnnualSavings(monthlyPrice: number): number {
    const yearlyPrice = monthlyPrice * 12;
    const discountedPrice = this.calculateAnnualPrice(monthlyPrice);
    return parseFloat((yearlyPrice - discountedPrice).toFixed(2));
  }

  calculateMaxInstallments(price: number): number {
    if (price < this.installmentIncrement) {
      return 1;
    }

    const maxInstallmentsByValue = Math.floor(price / this.installmentIncrement);
    const installments = Math.min(maxInstallmentsByValue, this.maxInstallmentsConfig);

    return installments > 0 ? installments : 1;
  }

  getPlanIntervalText(): string {
    if (this.isAnnualBilling) {
      return "por ano";
    }
    return "por mês";
  }

  getAnnualSavingsText(): string {
    if (this.isAnnualBilling && this.plan?.annualSavings) {
      return `(Economize R$ ${this.formatPrice(this.plan.annualSavings)})`;
    }
    return "";
  }

  getCurrentSubscriptionPlanPrice(): number {
    if (this.currentPlan && typeof this.currentPlan.price === "number") {
      return this.currentPlan.price;
    }
    return 0;
  }

  getNewPlanPrice(): number {
    if (this.plan && typeof this.plan.price === "number") {
      return this.plan.price;
    }
    return 0;
  }

  getDisplayPrice(): number {
    if (this.couponValidated && this.couponInfo) {
      if (this.planChangeType === PlanChangeType.UPGRADE) {
        return this.amountToPay;
      } else {
        return this.couponInfo.discountedPrice;
      }
    }

    if (this.planChangeType === PlanChangeType.UPGRADE) {
      return this.amountToPay;
    }

    return this.plan?.price || 0;
  }

  isFreeWithCoupon(): boolean {
    return this.couponValidated && this.couponInfo && this.couponInfo.discount === 100;
  }

  shouldShowParcelamento(): boolean {
    const hasValidPlan = this.plan && this.plan.maxInstallments > 1;
    const isCreditCardSelected = this.selectedPaymentMethod === PaymentMethod.CREDIT_CARD;
    const hasPriceGreaterThanZero = this.getDisplayPrice() > 0;

    return hasValidPlan && isCreditCardSelected && hasPriceGreaterThanZero;
  }

  generateInstallmentOptions(valueToInstall = 0): void {
    this.installmentOptions = [];

    let baseValue = valueToInstall > 0 ? valueToInstall : this.plan.price;
    if (this.couponValidated && this.couponInfo && this.planChangeType !== PlanChangeType.UPGRADE) {
      baseValue = this.couponInfo.discountedPrice;
    }

    const maxInstallments = this.calculateMaxInstallments(baseValue);

    for (let i = 1; i <= maxInstallments; i++) {
      const installmentAmount = baseValue / i;

      if (installmentAmount < this.installmentIncrement && i > 1) {
        break;
      }

      let label = `${i}x de R$ ${installmentAmount.toFixed(2).replace(".", ",")}`;

      if (i === 1) {
        label += " (à vista)";
      }

      this.installmentOptions.push({
        value: i,
        label: label,
        amount: installmentAmount,
      });
    }

    this.selectedInstallment = 1;
  }

  calculateInstallmentValue(): void {
    if (!this.plan) return;

    const selectedOption = this.installmentOptions.find((option) => option.value === +this.selectedInstallment);
    if (selectedOption) {
      this.installmentValue = selectedOption.amount;
    }
  }

  getMainFeatures(): string[] {
    if (!this.plan || !this.plan.features) {
      return [];
    }
    return this.plan.features;
  }

  goToPricing(): void {
    this.router.navigate(["/"]);
  }

  getCurrentPlanEndDate(): string {
    if (this.currentSubscription && this.currentSubscription.endDate) {
      return this.formatDate(new Date(this.currentSubscription.endDate));
    }
    return "";
  }

  startProcessingMessageRotation(): void {
    this.processingMessage = this.processingMessages[0];
    this.currentMessageIndex = 0;

    const messageInterval = setInterval(() => {
      this.currentMessageIndex = (this.currentMessageIndex + 1) % this.processingMessages.length;
      this.processingMessage = this.processingMessages[this.currentMessageIndex];
    }, 3000);

    this.subscriptions.push(
      new Subscription(() => {
        clearInterval(messageInterval);
      })
    );
  }

  processPayment(): void {
    if (this.isFreeWithCoupon()) {
      this.processFreePlan();
      return;
    }

    const needsPaymentInfo = this.shouldRequirePayment || this.planChangeType === PlanChangeType.NEW || this.planChangeType === PlanChangeType.RENEWAL;

    if (needsPaymentInfo && !this.validateForm()) {
      return;
    }

    if (!needsPaymentInfo && !this.validateFormMinimal()) {
      return;
    }

    this.isButtonLoading = true;
    this.startProcessingMessageRotation();

    let paymentData: any = {
      method: this.selectedPaymentMethod,
      reference: `payment_${Date.now()}`,
    };

    if (this.selectedPaymentMethod === PaymentMethod.CREDIT_CARD) {
      if (this.selectedCardId) {
        paymentData.savedCardId = this.selectedCardId;
        paymentData.installments = this.selectedInstallment;
      } else {
        paymentData.creditCard = {
          holderName: this.cardName,
          number: this.cardNumber.replace(/\D/g, ""),
          expiryMonth: this.cardExpiry.split("/")[0],
          expiryYear: "20" + this.cardExpiry.split("/")[1],
          ccv: this.cardCvv,
        };

        paymentData.saveCard = true;
        paymentData.installments = this.selectedInstallment;
      }
    }

    const requestData: any = {
      paymentData,
      garageId: this.garageInfo._id,
    };

    if (this.isAnnualBilling) {
      requestData.interval = "yearly";
    } else {
      requestData.interval = "monthly";
    }

    if (this.couponValidated && this.couponInfo) {
      requestData.couponCode = this.couponCode;
    }

    if (this.planChangeType === PlanChangeType.UPGRADE) {
      requestData.newPlanId = this.plan._id;
      requestData.currentSubscriptionId = this.currentSubscription.id;
    } else {
      requestData.planId = this.plan._id;
    }

    let apiCall: Observable<any>;

    switch (this.planChangeType) {
      case PlanChangeType.UPGRADE:
        apiCall = this.paymentService.upgradePlan(requestData);
        break;
      case PlanChangeType.RENEWAL:
        apiCall = this.paymentService.renewSubscription(requestData);
        break;
      default:
        apiCall = this.paymentService.processPayment(requestData, this.isRegistrationMode);
    }

    apiCall.subscribe({
      next: this.handlePaymentResponse.bind(this),
      error: (error) => {
        this.isButtonLoading = false;

        let errorMessage = error.error.error ? error.error.error : "Não foi possível processar o pagamento. Tente novamente.";

        this.alertService.showAlert("Erro", errorMessage, "error", "Fechar");
      },
    });
  }

  processFreePlan(): void {
    this.isButtonLoading = true;
    this.startProcessingMessageRotation();

    const requestData: any = {
      garageId: this.garageInfo._id,
      planId: this.plan._id,
      couponCode: this.couponCode,
      isFreeWithCoupon: true,
    };

    if (this.isAnnualBilling) {
      requestData.interval = "yearly";
    } else {
      requestData.interval = "monthly";
    }

    if (this.planChangeType === PlanChangeType.UPGRADE) {
      requestData.currentSubscriptionId = this.currentSubscription.id;
      requestData.newPlanId = this.plan._id;
    }

    let apiCall: Observable<any>;
    switch (this.planChangeType) {
      case PlanChangeType.UPGRADE:
        apiCall = this.paymentService.upgradePlan(requestData);
        break;
      case PlanChangeType.RENEWAL:
        apiCall = this.paymentService.renewSubscription(requestData);
        break;
      default:
        apiCall = this.paymentService.processPayment(requestData, this.isRegistrationMode);
    }

    apiCall.subscribe({
      next: (response) => {
        this.isButtonLoading = false;

        if (this.isRegistrationMode) {
          this.paymentCompleted.emit(response);
        } else {
          let message = "Sua assinatura gratuita foi ativada com sucesso!";
          if (this.planChangeType === PlanChangeType.UPGRADE) {
            message = `Upgrade para o plano ${this.plan.name} realizado com sucesso!`;
          } else if (this.planChangeType === PlanChangeType.RENEWAL) {
            message = "Sua assinatura foi renovada com sucesso!";
          }

          this.alertService.showAlert("Sucesso!", message, "success", "Acessar sistema");
          this.router.navigate(["/system"]);
        }
      },
      error: (error) => {
        this.isButtonLoading = false;

        let errorMessage = error.error?.msg || "Não foi possível ativar o plano gratuito. Tente novamente.";
        this.alertService.showAlert("Erro", errorMessage, "error", "Fechar");
      },
    });
  }

  handlePaymentResponse(response: any): void {
    if (this.selectedPaymentMethod === PaymentMethod.PIX && response.body && response.body.payment && response.body.payment.pixQrCode) {
      const pixData = response.body.payment;
      this.pixQrCode = pixData.pixQrCode;
      this.pixCode = pixData.pixCopiaECola;
      if (pixData.expirationDate) {
        if (typeof pixData.expirationDate === "string") {
          this.pixExpirationDate = new Date(pixData.expirationDate.replace(" ", "T"));
        } else {
          this.pixExpirationDate = new Date(pixData.expirationDate);
        }
      }

      this.pixPaymentId = response.body.payment.id;
      this.pixIsProcessing = true;
      this.isButtonLoading = false;
      window.scrollTo(0, 0);
      this.startPixStatusCheck();
      return;
    }

    this.isButtonLoading = false;

    if (response.status === 200) {
      if (this.isRegistrationMode) {
        this.paymentCompleted.emit(response);
      } else {
        let message = "Agradecemos sua confiança! Sua assinatura foi realizada com sucesso.";

        if (this.planChangeType === PlanChangeType.UPGRADE) {
          message = `Upgrade realizado com sucesso! Você agora está no plano ${this.plan.name}.`;
        } else if (this.isRenewal) {
          message = "Sua assinatura foi renovada com sucesso! Obrigado pela confiança.";
        }

        this.alertService.showAlert("Sucesso!", message, "success", "Acessar sistema");
        this.router.navigate(["/system"]);
      }
    }
  }

  startPixStatusCheck(): void {
    if (!this.pixPaymentId) return;

    if (this.pixStatusCheckInterval) {
      clearInterval(this.pixStatusCheckInterval);
    }

    this.pixStatusCheckInterval = setInterval(() => {
      this.checkPixStatus();
    }, 30000);
  }

  checkPixStatus(): void {
    if (!this.pixPaymentId || !this.pixIsProcessing) return;

    this.paymentService.checkPaymentStatus(this.pixPaymentId, this.isRegistrationMode).subscribe({
      next: (response: any) => {
        if (response.body && response.body.result && response.body.result.asaasStatus === "RECEIVED") {
          clearInterval(this.pixStatusCheckInterval);
          this.pixIsProcessing = false;

          if (this.isRegistrationMode) {
            this.paymentCompleted.emit(response);
          } else {
            this.alertService.showAlert("Pagamento Confirmado!", "Seu pagamento PIX foi confirmado com sucesso!", "success", "Continuar").then(() => {
              this.router.navigate(["/system"]);
            });
          }
        }
      },
      error: (error) => {
      },
    });
  }

  manualCheckPixStatus(): void {
    this.isButtonLoading = true;
    this.checkPixStatus();
    setTimeout(() => {
      this.isButtonLoading = false;
    }, 1500);
  }

  validateFormMinimal(): boolean {
    return true;
  }

  validateForm(): boolean {
    if (this.selectedPaymentMethod === PaymentMethod.PIX) {
      return true;
    }

    if (this.selectedPaymentMethod === PaymentMethod.CREDIT_CARD) {
      if (this.selectedCardId) {
        return true;
      } else {
        if (!this.cardNumber || this.cardNumber.replace(/\D/g, "").length < 16) {
          this.alertService.showAlert("Erro", "Número do cartão inválido.", "error", "Fechar");
          return false;
        }

        if (!this.cardName || this.cardName.trim().length < 3) {
          this.alertService.showAlert("Erro", "Nome no cartão é obrigatório.", "error", "Fechar");
          return false;
        }

        if (!this.cardExpiry || !/^\d{2}\/\d{2}$/.test(this.cardExpiry)) {
          this.alertService.showAlert("Erro", "Data de validade inválida. Use o formato MM/AA.", "error", "Fechar");
          return false;
        }

        if (this.cardExpiry) {
          const [month, year] = this.cardExpiry.split("/");
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear() % 100;
          const currentMonth = currentDate.getMonth() + 1;

          if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
            this.alertService.showAlert("Erro", "O cartão está expirado.", "error", "Fechar");
            return false;
          }
        }

        if (!this.cardCvv || !/^\d{3,4}$/.test(this.cardCvv)) {
          this.alertService.showAlert("Erro", "CVV inválido. Use 3 ou 4 dígitos.", "error", "Fechar");
          return false;
        }
      }
    }

    return true;
  }

  validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  shouldShowPaymentFields(): boolean {
    return (this.shouldRequirePayment || this.planChangeType === PlanChangeType.NEW || this.planChangeType === PlanChangeType.RENEWAL) && !this.isFreeWithCoupon();
  }

  getButtonText(): string {
    if (this.isFreeWithCoupon()) {
      return "Ativar Plano Gratuito";
    }

    if (this.selectedPaymentMethod === PaymentMethod.PIX) {
      return "Gerar QR Code PIX";
    }

    switch (this.planChangeType) {
      case PlanChangeType.UPGRADE:
        return this.shouldRequirePayment ? "Confirmar Upgrade" : "Fazer Upgrade Gratuito";
      case PlanChangeType.RENEWAL:
        return "Renovar Assinatura";
      case PlanChangeType.NEW:
        return "Finalizar Assinatura";
      default:
        return "Finalizar";
    }
  }

  formatDate(date: Date): string {
    if (!date) return "";

    try {
      return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()} às ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    } catch (error) {
      return "Data inválida";
    }
  }

  getButtonClass(): string {
    if (this.isFreeWithCoupon()) {
      return "bg-gradient-to-r from-green-500 to-green-600";
    }

    if (this.selectedPaymentMethod === PaymentMethod.PIX) {
      return "bg-gradient-to-r from-purple-500 to-purple-600";
    }

    if (this.planChangeType === PlanChangeType.UPGRADE) {
      return "bg-gradient-to-r from-green-500 to-green-600";
    } else if (this.planChangeType === PlanChangeType.RENEWAL) {
      return "bg-gradient-to-r from-yellow-500 to-yellow-600";
    } else {
      return "bg-gradient-to-r from-[#EC9253] to-[#f78839]";
    }
  }

  copyPixCode(): void {
    navigator.clipboard.writeText(this.pixCode).then(
      () => {
        this.alertService.showAlert("Copiado!", "Código PIX copiado para a área de transferência.", "success", "OK");
      },
      (err) => {
        this.alertService.showAlert("Erro", "Não foi possível copiar o código PIX.", "error", "Fechar");
      }
    );
  }

  getSafePixQrCode(): SafeUrl {
    if (!this.pixQrCode) {
      return "";
    }
    if (this.pixQrCode.startsWith("data:image")) {
      return this.sanitizer.bypassSecurityTrustUrl(this.pixQrCode);
    }
    return this.sanitizer.bypassSecurityTrustUrl(`data:image/png;base64,${this.pixQrCode}`);
  }

  formatPrice(value: number): string {
    return value.toFixed(2).replace(".", ",");
  }

  setupInputAutoAdvance() {
    this.cardNameInput.onFocus();
  }

  validateCoupon(): void {
    if (!this.couponCode) {
      this.couponError = "Por favor, digite um código de cupom.";
      return;
    }

    this.validatingCoupon = true;
    this.couponError = "";

    const interval = this.isAnnualBilling ? "yearly" : "monthly";
    this.paymentService.validateCoupon(this.couponCode, this.plan._id, interval, this.isRegistrationMode).subscribe({
      next: (response: any) => {
        if (response.valid) {
          this.couponValidated = true;
          this.couponInfo = response;

          if (this.planChangeType === PlanChangeType.UPGRADE) {
            const discountAmount = (this.amountToPay * response.discount) / 100;
            this.amountToPay = Math.max(0, this.amountToPay - discountAmount);
          }

          this.generateInstallmentOptions(this.getDisplayPrice());
          this.calculateInstallmentValue();
          this.validatingCoupon = false;

          window.scrollTo(0, 0);
        } else {
          this.couponError = response.msg || "Cupom inválido ou expirado.";
          this.validatingCoupon = false;
        }
      },
      error: (error: any) => {
        this.validatingCoupon = false;

        if (error.error?.msg && error.error.msg.includes("não é válido para este plano")) {
          this.handleCouponForDifferentPlan(error.error);
        } else {
          this.couponError = error.error?.msg || "Erro ao validar o cupom. Tente novamente.";
        }
      },
    });
  }

  handleCouponForDifferentPlan(errorResponse: any): void {
    this.paymentService.getPlanForCoupon(this.couponCode, this.isRegistrationMode).subscribe({
      next: (response: any) => {
        if (response.body && response.body.result) {
          const planForCoupon = response.body.result;

          this.alertService.showAlert("Cupom para outro plano", `Este cupom é válido apenas para o plano "${planForCoupon.name}". Deseja mudar para este plano?`, "info", "Confirmar", "Cancelar").then((confirmed) => {
            if (confirmed) {
              const currentUrl = this.router.url;
              const basePath = currentUrl.split("/payment/")[0];
              const newUrl = `${basePath}/payment/${planForCoupon._id}?coupon=${this.couponCode}`;
              window.location.href = newUrl;
            } else {
              this.couponError = "Este cupom não é válido para o plano selecionado.";
              this.couponCode = "";
            }
          });
        } else {
          this.couponError = "Não foi possível encontrar o plano para este cupom.";
        }
      },
      error: (error) => {
        this.couponError = "Erro ao validar o cupom. Tente novamente.";
      },
    });
  }

  removeCoupon(): void {
    this.couponValidated = false;
    this.couponInfo = null;
    this.couponCode = "";
    this.couponError = "";

    if (this.planChangeType === PlanChangeType.UPGRADE) {
      this.calculateUpgradePreview();
    }

    this.generateInstallmentOptions(this.getDisplayPrice());
    this.calculateInstallmentValue();

    window.scrollTo(0, 0);
  }

  changePlan(): void {
    this.changePlanRequested.emit();
  }

  checkForStoredCoupon(): void {
    const storedCouponCode = this.couponService.getCouponCode();
    if (storedCouponCode && !this.couponCode) {
      this.couponCode = storedCouponCode;
      
      this.subscriptions.push(
        interval(500)
          .pipe(
            filter(() => this.plan !== null && !this.isPageLoading),
            take(1)
          )
          .subscribe(() => {
            this.validateCoupon();
          })
      );
    }
  }

}
