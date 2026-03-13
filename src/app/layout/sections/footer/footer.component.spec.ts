import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterComponent } from './footer.component';
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {TranslateModule} from "@ngx-translate/core";
import {PLATFORM_ID} from "@angular/core";

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent, HttpClientTestingModule, TranslateModule.forRoot()],
    })
      .compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it("should not skip entry animation", async() => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    })
      .compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component['skipEntryAnimation']).toBeFalsy();
  });
});
