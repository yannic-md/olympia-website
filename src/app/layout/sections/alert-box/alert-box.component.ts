import {Component, input, InputSignal, OnInit, output, OutputEmitterRef} from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';

type AlertType = 'success' | 'error';

@Component({
  selector: 'app-alert-box',
  imports: [],
  templateUrl: './alert-box.component.html',
  styleUrl: './alert-box.component.css',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class AlertBoxComponent implements OnInit {
  type: InputSignal<AlertType> = input<AlertType>('success');
  title: InputSignal<string> = input.required<string>();
  message: InputSignal<string> = input.required<string>();
  duration: InputSignal<number> = input<number>(3000);
  dismissed: OutputEmitterRef<void> = output<void>();

  protected readonly alertConfig = {
    success: {
      bgColor: 'bg-green-300',
      borderColor: 'border-green-600',
      textColor: 'text-green-800',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    error: {
      bgColor: 'bg-red-300',
      borderColor: 'border-red-600',
      textColor: 'text-red-800',
      iconPath: 'M6 18L18 6M6 6l12 12'
    },
  };

  ngOnInit(): void {
    if (this.duration() > 0) {
      setTimeout(() => this.dismissed.emit(), this.duration());
    }
  }

  protected getConfig() {
    return this.alertConfig[this.type()];
  }
}
