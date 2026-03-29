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
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {HttpErrorResponse} from "@angular/common/http";
import {MiscService} from "../../../../services/misc/misc.service";
import {AlertService} from "../../../../services/api/alert/alert.service";
import {ImportService} from "../../../../services/api/import/import.service";
import {ImportResponse, ImportError} from "../../../../types/Importer";
import {DataHolderService} from "../../../../services/data-holder/data-holder.service";

@Component({
  selector: 'app-modal-import',
  imports: [FormsModule, NgOptimizedImage, TranslatePipe],
  templateUrl: './modal-import.component.html',
  styleUrl: './modal-import.component.css',
})
export class ModalImportComponent {
  isOpen: InputSignal<boolean> = input.required<boolean>();
  importTitle: InputSignal<string> = input<string>('MODAL.IMPORT.TITLE');
  importType: InputSignal<'countries' | 'athletes' | 'results'> = input.required<'countries' | 'athletes' | 'results'>();
  closeModal: OutputEmitterRef<void> = output<void>();
  importComplete: OutputEmitterRef<void> = output<void>();

  protected selectedFile: WritableSignal<File | null> = signal(null);
  protected isLoading: WritableSignal<boolean> = signal(false);
  protected importErrors: WritableSignal<ImportError[] | null> = signal(null);
  protected isDragActive: WritableSignal<boolean> = signal(false);
  protected isClosing: WritableSignal<boolean> = signal(false);

  constructor(protected miscService: MiscService, private translateService: TranslateService,
              private alertService: AlertService, private importService: ImportService,
              private dataService: DataHolderService) {}

  /**
   * Handles file selection from the input element.
   */
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files && files.length > 0) {
      this.processSelectedFile(files[0]);
    }
  }

  /**
   * Handles dragover on drop zone to enable dropping files.
   */
  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.isLoading()) {
      return;
    }
    this.isDragActive.set(true);
  }

  /**
   * Resets drag state when leaving drop zone.
   */
  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive.set(false);
  }

  /**
   * Accepts file drops and processes first file.
   */
  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive.set(false);

    if (this.isLoading()) {
      return;
    }

    const file = event.dataTransfer?.files?.[0] ?? null;
    if (file) {
      this.processSelectedFile(file);
    }
  }

  /**
   * Centralized file validation for picker and drag-and-drop.
   */
  private processSelectedFile(file: File): void {
    if (this.isValidFileType(file)) {
      this.selectedFile.set(file);
      return;
    }

    this.alertService.error(this.translateService.instant('ALERT.IMPORT.INVALID.FILE'));
    this.selectedFile.set(null);
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
    return validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  }

  /**
   * Submits the import and processes the file.
   * Sends the file to the appropriate backend endpoint based on importType.
   */
  protected onSubmit(): void {
    const file = this.selectedFile();
    if (!file) {
      this.alertService.error(this.translateService.instant('ALERT.IMPORT.NO.FILE'));
      return;
    }

    this.isLoading.set(true);
    this.importErrors.set(null);

    const importType = this.importType();
    let importObservable;

    switch (importType) {
      case 'countries':
        importObservable = this.importService.importCountries(file);
        break;
      case 'athletes':
        importObservable = this.importService.importAthletes(file);
        break;
      case 'results':
        importObservable = this.importService.importResults(file);
        break;
      default:
        this.alertService.error('Invalid import type');
        this.isLoading.set(false);
        return;
    }

    importObservable.subscribe({
      next: (response: ImportResponse): void => {
        this.isLoading.set(false);

        if (response.status === 'COMPLETED' || response.status === 'PARTIAL') {
          // Reload data from server
          this.dataService.load();

          const message = this.formatSuccessMessage(response);
          this.alertService.success(message);

          // Store errors if any
          if (response.errors && response.errors.length > 0) {
            this.importErrors.set(response.errors);
          }

          // Close modal after successful import
          setTimeout((): void => {
            this.importComplete.emit();
            this.close();
          }, 500);
        } else {
          this.alertService.error(response.message || this.translateService.instant('ALERT.IMPORT.ERROR'));
          if (response.errors && response.errors.length > 0) {
            this.importErrors.set(response.errors);
          }
        }
      },
      error: (error: HttpErrorResponse): void => {
        this.isLoading.set(false);
        console.error('Import error:', error);

        let errorMessage = this.translateService.instant('ALERT.IMPORT.ERROR');

        if (error.status === 400 && error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 0) {
          errorMessage = this.translateService.instant('ALERT.IMPORT.NETWORK_ERROR');
        }

        this.alertService.error(errorMessage);
      }
    });
  }

  /**
   * Format success message based on import response
   */
  private formatSuccessMessage(response: ImportResponse): string {
    const successCount = response.successfulRecords;
    const totalCount = response.totalRecords;

    if (response.status === 'COMPLETED') {
      return this.translateService.instant('ALERT.IMPORT.SUCCESS')
        .replace('[count]', successCount.toString())
        .replace('[total]', totalCount.toString());
    } else {
      // PARTIAL
      const failedCount = response.failedRecords;
      return this.translateService.instant('ALERT.IMPORT.PARTIAL')
        .replace('[success]', successCount.toString())
        .replace('[failed]', failedCount.toString())
        .replace('[total]', totalCount.toString());
    }
  }

  /**
   * Resets the form and closes the modal.
   */
  protected close(): void {
    this.isClosing.set(true);
    setTimeout((): void => {
      this.selectedFile.set(null);
      this.isLoading.set(false);
      this.isDragActive.set(false);
      this.isClosing.set(false);
      this.closeModal.emit();
    }, 200);
  }
}
