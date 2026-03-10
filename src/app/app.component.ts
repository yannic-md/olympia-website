import {Component} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {CookieBannerComponent} from "./layout/elements/cookie-banner/cookie-banner.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CookieBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {}
