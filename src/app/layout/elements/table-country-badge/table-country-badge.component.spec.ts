import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCountryBadgeComponent } from './table-country-badge.component';

describe('TableCountryBadgeComponent', () => {
  let component: TableCountryBadgeComponent;
  let fixture: ComponentFixture<TableCountryBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCountryBadgeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableCountryBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
