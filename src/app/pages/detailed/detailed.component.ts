import { Component } from '@angular/core';
import {HeaderComponent} from "../../layout/header/header.component";
import {BreadcrumbComponent} from "../../layout/breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-detailed',
  imports: [
    HeaderComponent,
    BreadcrumbComponent
  ],
  templateUrl: './detailed.component.html',
  styleUrl: './detailed.component.css',
})
export class DetailedComponent {

}
