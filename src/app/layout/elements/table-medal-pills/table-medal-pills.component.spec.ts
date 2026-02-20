import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableMedalPillsComponent } from './table-medal-pills.component';

describe('TableMedalPillsComponent', () => {
  let component: TableMedalPillsComponent;
  let fixture: ComponentFixture<TableMedalPillsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableMedalPillsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableMedalPillsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
