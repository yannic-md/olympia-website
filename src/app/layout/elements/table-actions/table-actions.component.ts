import {Component, output, OutputEmitterRef} from '@angular/core';

@Component({
  selector: 'app-table-actions',
  imports: [],
  templateUrl: './table-actions.component.html',
  styleUrl: './table-actions.component.css',
})
export class TableActionsComponent {
  edit: OutputEmitterRef<void> = output<void>();
  delete: OutputEmitterRef<void> = output<void>();
}
