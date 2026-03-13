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
  });

  it('should return all medals with correct order, count and css when filter is all', () => {
    fixture.componentRef.setInput('medals', { gold: 3, silver: 2, bronze: 1 });
    fixture.componentRef.setInput('activeFilter', 'all');
    fixture.detectChanges();

    const result = (component as any).displayMedals();

    expect(result).toEqual([
      { type: 'gold', count: 3, css: 'bg-[rgb(252,200,97)]' },
      { type: 'silver', count: 2, css: 'bg-[rgb(229,229,229)]' },
      { type: 'bronze', count: 1, css: 'bg-[rgb(220,179,134)]' }
    ]);
  });

  it('should filter medals by active filter and recompute when the filter changes', () => {
    fixture.componentRef.setInput('medals', { gold: 5, silver: 4, bronze: 3 });

    fixture.componentRef.setInput('activeFilter', 'gold');
    fixture.detectChanges();
    expect((component as any).displayMedals()).toEqual([
      { type: 'gold', count: 5, css: 'bg-[rgb(252,200,97)]' }
    ]);

    fixture.componentRef.setInput('activeFilter', 'silver');
    fixture.detectChanges();
    expect((component as any).displayMedals()).toEqual([
      { type: 'silver', count: 4, css: 'bg-[rgb(229,229,229)]' }
    ]);

    fixture.componentRef.setInput('activeFilter', 'bronze');
    fixture.detectChanges();
    expect((component as any).displayMedals()).toEqual([
      { type: 'bronze', count: 3, css: 'bg-[rgb(220,179,134)]' }
    ]);
  });
});
