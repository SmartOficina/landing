import { Routes } from "@angular/router";

export const LANDING_PAGE_ROUTS: Routes = [
    {
        path: '',
        loadComponent: () => import('./landing-page.component').then((c) => c.LandingPageComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./components/registration/registration.component').then((c) => c.RegistrationComponent)
    },
    {
        path: 'payment/:id',
        loadComponent: () => import('./components/payment/payment.component').then((c) => c.PaymentComponent)
    },
    {
        path: 'faq',
        loadComponent: () => import('./components/faq/faq.component').then((c) => c.FaqComponent)
    },
    {
        path: 'privacy-policy',
        loadComponent: () => import('./components/legal/privacy-policy/privacy-policy.component').then((c) => c.PrivacyPolicyComponent)
    },
    {
        path: 'terms-of-use',
        loadComponent: () => import('./components/legal/terms/terms.component').then((c) => c.TermsComponent)
    },
    {
        path: 'activation-success',
        loadComponent: () => import('./components/activation-success/activation-success.component').then((c) => c.ActivationSuccessComponent)
    },
    {
        path: 'activation-error',
        loadComponent: () => import('./components/activation-error/activation-error.component').then((c) => c.ActivationErrorComponent)
    }
]