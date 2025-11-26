import { Routes } from "@angular/router";

export const APP_ROUTES: Routes = [
  {
    path: '',
    loadChildren: () => import('@features/landing-page/landing-page.routes').then(r => r.LANDING_PAGE_ROUTS),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
