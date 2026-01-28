import { Routes } from '@angular/router';
import {HomeComponent} from "./pages/home/home.component";
import {DetailedComponent} from "./pages/detailed/detailed.component";
import {LoginComponent} from "./pages/login/login.component";

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'detailed', component: DetailedComponent },
  { path: '**', component: HomeComponent }
];
