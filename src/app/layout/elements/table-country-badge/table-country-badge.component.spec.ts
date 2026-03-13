import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

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
  });

  it('should render country name and lowercase flag URL', () => {
    fixture.componentRef.setInput('code', 'DE');
    fixture.componentRef.setInput('name', 'Germany');
    fixture.detectChanges();

    const name = fixture.debugElement.query(By.css('span')).nativeElement as HTMLSpanElement;

    expect((component as any).flagUrl()).toBe('https://flagcdn.com/h20/de.png');
    expect(name.textContent?.trim()).toBe('Germany');
  });

  it('should show fallback badge when flag image emits error', () => {
    fixture.componentRef.setInput('code', 'FR');
    fixture.componentRef.setInput('name', 'France');
    fixture.detectChanges();

    const img = fixture.debugElement.query(By.css('img'));
    img.triggerEventHandler('error', new Event('error'));
    fixture.detectChanges();

    const fallback = fixture.debugElement.query(By.css('div.bg-gray-300'));
    const imgAfterError = fixture.debugElement.query(By.css('img'));

    expect((component as any).isError).toBe(true);
    expect(fallback.nativeElement.textContent.trim()).toBe('?');
    expect(imgAfterError).toBeNull();
  });

  it('should apply default and small version classes based on smallVersion input', () => {
    fixture.componentRef.setInput('code', 'US');
    fixture.componentRef.setInput('name', 'United States');

    fixture.componentRef.setInput('smallVersion', false);
    fixture.detectChanges();
    let wrapper = fixture.debugElement.query(By.css('div.flex.items-center')).nativeElement as HTMLDivElement;
    let img = fixture.debugElement.query(By.css('img')).nativeElement as HTMLImageElement;
    let name = fixture.debugElement.query(By.css('span')).nativeElement as HTMLSpanElement;

    expect(wrapper.className).toContain('gap-2');
    expect(img.className).toContain('w-5');
    expect(name.className).not.toContain('text-xs');

    fixture.componentRef.setInput('smallVersion', true);
    fixture.detectChanges();
    wrapper = fixture.debugElement.query(By.css('div.flex.items-center')).nativeElement as HTMLDivElement;
    img = fixture.debugElement.query(By.css('img')).nativeElement as HTMLImageElement;
    name = fixture.debugElement.query(By.css('span')).nativeElement as HTMLSpanElement;

    expect(wrapper.className).toContain('gap-1');
    expect(img.className).toContain('w-3');
    expect(name.className).toContain('text-xs');
  });
});
