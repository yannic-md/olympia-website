import {
  Component,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
  signal,
  WritableSignal
} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {NgOptimizedImage} from "@angular/common";
import {animate, style, transition, trigger} from "@angular/animations";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {HttpErrorResponse} from "@angular/common/http";
import {MiscService} from "../../../../services/misc/misc.service";
import {AlertService} from "../../../../services/api/alert/alert.service";

@Component({
  selector: 'app-modal-import',
  imports: [FormsModule, NgOptimizedImage, TranslatePipe],
  templateUrl: './modal-import.component.html',
  styleUrl: './modal-import.component.css',
  animations: [
    trigger('backdropFade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('modalSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(-20px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95) translateY(-20px)' }))
      ])
    ])
  ]
})
export class ModalImportComponent {
  isOpen: InputSignal<boolean> = input.required<boolean>();
  closeModal: OutputEmitterRef<void> = output<void>();
  importComplete: OutputEmitterRef<void> = output<void>();

  protected selectedFile: WritableSignal<File | null> = signal(null);
  protected isLoading: WritableSignal<boolean> = signal(false);

  constructor(protected miscService: MiscService, private translateService: TranslateService,
              private alertService: AlertService) {}

  /**
   * Handles file selection from the input element.
   */
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files && files.length > 0) {
      const file = files[0];
      // Validate file type (CSV or Excel)
      if (this.isValidFileType(file)) {
        this.selectedFile.set(file);
      } else {
        this.alertService.error(this.translateService.instant('ALERT.IMPORT.INVALID.FILE'));
        this.selectedFile.set(null);
      }
    }
  }

  /**
   * Validates if the selected file is of an acceptable type.
   */
  private isValidFileType(file: File): boolean {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    return validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx');
  }

  /**
   * Submits the import and processes the file.
   */
  protected onSubmit(): void {
    const file = this.selectedFile();
    if (!file) {
      this.alertService.error(this.translateService.instant('ALERT.IMPORT.NO.FILE'));
      return;
    }

    this.isLoading.set(true);

    // TODO: Implement actual file upload and processing
    // This would involve:
    // 1. Reading the file
    // 2. Parsing CSV/Excel
    // 3. Calling the import API endpoint
    // 4. Handling response and updating local data

    // Simulate API call
    setTimeout(() => {
      this.isLoading.set(false);
      this.alertService.success(this.translateService.instant('ALERT.IMPORT.SUCCESS'));
      this.importComplete.emit();
      this.close();
    }, 1500);
  }

  /**
   * Resets the form and closes the modal.
   */
  protected close(): void {
    this.selectedFile.set(null);
    this.isLoading.set(false);
    this.closeModal.emit();
  }
}

