import {Component, Inject, OnDestroy, PLATFORM_ID, signal, WritableSignal} from '@angular/core';
import {HeaderComponent} from '../../layout/sections/header/header.component';
import {BreadcrumbComponent} from '../../layout/sections/breadcrumb/breadcrumb.component';
import {FormsModule} from '@angular/forms';
import {FooterComponent} from '../../layout/sections/footer/footer.component';
import {isPlatformBrowser, NgOptimizedImage} from '@angular/common';
import {FilterSelectComponent} from '../../layout/elements/filter-select/filter-select.component';
import {AlertBoxComponent} from '../../layout/sections/alert-box/alert-box.component';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';
import {DataHolderService} from '../../services/data-holder/data-holder.service';
import {AthleteViewComponent} from './views/athlete-view/athlete-view.component';
import {CountryViewComponent} from './views/country-view/country-view.component';
import {DisciplinesViewComponent} from './views/disciplines-view/disciplines-view.component';

@Component({
  selector: 'app-detailed',
  imports: [
    HeaderComponent,
    BreadcrumbComponent,
    FormsModule,
    FooterComponent,
    FilterSelectComponent,
    NgOptimizedImage,
    AlertBoxComponent,
    TranslatePipe,
    AthleteViewComponent,
    CountryViewComponent,
    DisciplinesViewComponent,
  ],
  templateUrl: './detailed.component.html',
  styleUrl: './detailed.component.css',
})
export class DetailedComponent implements OnDestroy {
  protected selectedView: WritableSignal<'athletes' | 'countries' | 'disciplines'> =
    signal<'athletes' | 'countries' | 'disciplines'>('disciplines');
  protected filterCountry: WritableSignal<string> = signal<string>('all');
  protected filterSport: WritableSignal<string> = signal<string>('all');
  protected filterMedal: WritableSignal<'all' | 'gold' | 'silver' | 'bronze'> =
    signal<'all' | 'gold' | 'silver' | 'bronze'>('all');
  protected searchQuery: WritableSignal<string> = signal<string>('');
  protected skipEntryAnimation: boolean = false;
  private readonly translateSub: Subscription;

  constructor(@Inject(PLATFORM_ID) private platformId: Object,
              protected dataService: DataHolderService, protected translateService: TranslateService) {
    if (isPlatformBrowser(this.platformId)) {
      // Don't replay the animation after an in-app route change – only on the initial page load.
      this.skipEntryAnimation = document.readyState === 'complete';
    }

    this.dataService.load();
    this.translateSub = this.translateService.onLangChange.subscribe((): void => {
      this.dataService.load();
    });
  }

  /**
   * Unsubscribes from the translation language change observable to prevent memory leaks.
   */
  ngOnDestroy(): void {
    if (this.translateSub) { this.translateSub.unsubscribe(); }
  }
}

