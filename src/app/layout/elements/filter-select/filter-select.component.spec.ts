import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

import { FilterSelectComponent } from './filter-select.component';

@Component({
  standalone: true,
  imports: [FilterSelectComponent],
  template: `
    <app-filter-select
      [id]="id"
      [label]="label"
      [bold]="bold"
      [(value)]="value"
    >
      <option value="all">All</option>
      <option value="gold">Gold</option>
    </app-filter-select>
  `,
})
class TestHostComponent {
  id = 'medal-filter';
  label: string | undefined = undefined;
  bold = false;
  value = 'all';
}

describe('FilterSelectComponent', () => {
  let component: FilterSelectComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterSelectComponent, TestHostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    const child = fixture.debugElement.query(By.directive(FilterSelectComponent));
    component = child.componentInstance;
  });

  it('should throw when required id and value inputs are not provided', async () => {
    const incompleteFixture = TestBed.createComponent(FilterSelectComponent);
    expect(() => incompleteFixture.detectChanges()).toThrow();
  });

  it('should render label and apply bold class when inputs are set', () => {
    fixture.componentInstance.label = 'Filter by medal';
    fixture.componentInstance.bold = true;
    fixture.detectChanges();

    const label = fixture.debugElement.query(By.css('label')).nativeElement as HTMLLabelElement;
    const select = fixture.debugElement.query(By.css('select')).nativeElement as HTMLSelectElement;

    expect(label.textContent?.trim()).toBe('Filter by medal');
    expect(label.getAttribute('for')).toBe('medal-filter');
    expect(select.className).toContain('font-medium');
  });

  it('should update the bound value when selection changes', () => {
    fixture.detectChanges();
    const selectDe = fixture.debugElement.query(By.css('select'));

    selectDe.triggerEventHandler('ngModelChange', 'gold');
    fixture.detectChanges();

    expect(fixture.componentInstance.value).toBe('gold');
    expect(component.value()).toBe('gold');
  });
});
