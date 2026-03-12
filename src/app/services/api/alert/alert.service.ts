import { Injectable, signal, WritableSignal } from '@angular/core';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertMessage {
  message: string;
  type: AlertType;
  id: number;
  leaving?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  private idCounter: number = 0;
  readonly alerts: WritableSignal<AlertMessage[]> = signal([]);

  /**
   * Displays an alert message of the given type for a specified duration.
   *
   * @param {string} message - The message to display
   * @param {AlertType} type - The alert type ('success' | 'error' | 'warning' | 'info')
   * @param {number} duration - Auto-dismiss duration in ms (default: 4000)
   */
  show(message: string, type: AlertType = 'info', duration: number = 4000): void {
    const id: number = ++this.idCounter;
    this.alerts.update(current => [...current, { message, type, id }]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  /**
   * Removes an alert by its ID.
   *
   * @param {number} id - The ID of the alert to remove
   */
  dismiss(id: number): void {
    this.alerts.update(current => current.map(a => a.id === id ? { ...a, leaving: true } : a));
    setTimeout(() => {
      this.alerts.update(current => current.filter(a => a.id !== id));
    }, 200);
  }

  success(message: string, duration?: number): void { this.show(message, 'success', duration); }
  error(message: string, duration?: number): void { this.show(message, 'error', duration); }
  warning(message: string, duration?: number): void { this.show(message, 'warning', duration); }
  info(message: string, duration?: number): void { this.show(message, 'info', duration); }
}
