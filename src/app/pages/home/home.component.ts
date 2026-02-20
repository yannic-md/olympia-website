import { Component } from '@angular/core';
import {HeaderComponent} from "../../layout/sections/header/header.component";
import {BreadcrumbComponent} from "../../layout/sections/breadcrumb/breadcrumb.component";
import {NgOptimizedImage} from "@angular/common";
import {FooterComponent} from "../../layout/sections/footer/footer.component";
import {RouterLink} from "@angular/router";
import {MiscService} from "../../services/misc.service";

interface MedalWinner {
  type: 'Gold' | 'Silber' | 'Bronze';
  dotColor: string;
  countryName: string;
  flagCode: string;
}

interface Category {
  title: string;
  winners: MedalWinner[];
}

@Component({
  selector: 'app-home',
  imports: [
    HeaderComponent,
    BreadcrumbComponent,
    NgOptimizedImage,
    FooterComponent,
    RouterLink
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {

  protected categories: Category[] = [
    { // TODO: Needs real data.
      title: 'Damen',
      winners: [
        { type: 'Gold', dotColor: 'bg-[#FCD34D]', countryName: 'Vereinigte Staaten', flagCode: 'us' },
        { type: 'Silber', dotColor: 'bg-[#E5E7EB]', countryName: 'Frankreich', flagCode: 'fr' },
        { type: 'Bronze', dotColor: 'bg-[#D6A472]', countryName: 'Australien', flagCode: 'au' }
      ]
    },
    {
      title: 'Herren',
      winners: [
        { type: 'Gold', dotColor: 'bg-[#FCD34D]', countryName: 'Vereinigte Staaten', flagCode: 'us' },
        { type: 'Silber', dotColor: 'bg-[#E5E7EB]', countryName: 'Frankreich', flagCode: 'fr' },
        { type: 'Bronze', dotColor: 'bg-[#D6A472]', countryName: 'Serbien', flagCode: 'rs' }
      ]
    }
  ];

  constructor(protected miscService: MiscService) {}

}
