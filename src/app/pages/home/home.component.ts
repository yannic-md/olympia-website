import { Component } from '@angular/core';
import {HeaderComponent} from "../../layout/header/header.component";
import {BreadcrumbComponent} from "../../layout/breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-home',
  imports: [
    HeaderComponent,
    BreadcrumbComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {

}
