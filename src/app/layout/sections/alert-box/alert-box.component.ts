import {Component} from '@angular/core';
import {AlertMessage, AlertService} from "../../../services/api/alert/alert.service";

@Component({
  selector: 'app-alert-box',
  imports: [],
  templateUrl: './alert-box.component.html',
  styleUrl: './alert-box.component.css',
})
export class AlertBoxComponent {

  constructor(protected alertService: AlertService) {}

  /**
   * Returns the Tailwind CSS classes for the alert based on its type.
   *
   * @param {AlertMessage} alert - The alert message object
   * @returns {string} The CSS class string
   */
  protected getAlertClasses(alert: AlertMessage): string {
    const types: Record<string, string> = {
      success: 'bg-green-100 border-green-400 text-green-800',
      error:   'bg-red-100 border-red-400 text-red-800',
      warning: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      info:    'bg-blue-100 border-blue-400 text-blue-800'
    };
    return types[alert.type] ?? types['info'];
  }

  /**
   * Returns the icon path based on the alert type.
   *
   * @param {AlertMessage} alert - The alert message object
   * @returns {string} The icon asset path
   */
  protected getIcon(alert: AlertMessage): string {
    const icons: Record<string, string> = {
      success: 'M5 13l4 4L19 7',
      error:   'M6 18L18 6M6 6l12 12',
      warning: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
      info:    'M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z'
    };
    return icons[alert.type] ?? icons['info'];
  }
}
