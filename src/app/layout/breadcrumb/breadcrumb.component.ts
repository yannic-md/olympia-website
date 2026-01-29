import { Component } from '@angular/core';
import {RouterLink, RouterLinkActive} from "@angular/router";

interface NavigationItem {
  label: string;
  path?: string;
  externalUrl?: string;
}

@Component({
  selector: 'app-breadcrumb',
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css',
})
export class BreadcrumbComponent {
  protected nav_items: NavigationItem[] = [
    { label: 'Übersicht', path: '/' },
    { label: 'Detaillierte Ergebnisse', path: '/detailed' },
    { label: 'Excel-Daten hochladen', path: '/excel' },
    { label: 'Mehr über die Spiele erfahren', externalUrl: 'https://www.olympics.com/de/olympic-games/paris-2024' }
  ];

}
