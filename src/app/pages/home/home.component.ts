import { Component } from '@angular/core';
import {HeaderComponent} from "../../layout/header/header.component";
import {BreadcrumbComponent} from "../../layout/breadcrumb/breadcrumb.component";
import {NgOptimizedImage} from "@angular/common";
import {FooterComponent} from "../../layout/footer/footer.component";
import {RouterLink} from "@angular/router";

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

  /**
   * Returns the TailwindCSS background color class for a given medal type.
   *
   * @param type Medal type to map to a color class.
   * @returns TailwindCSS background color class for the specified medal type.
   */
  getWinnerColor(type: string): string {
    switch (type) {
      case 'Gold':
        return 'bg-[#FCD34D]';
      case 'Silber':
        return 'bg-[#E5E7EB]';
    }

    return 'bg-[#D6A472]'; // bronze
  }

}
