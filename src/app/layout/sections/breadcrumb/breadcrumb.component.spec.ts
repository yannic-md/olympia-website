import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BreadcrumbComponent } from './breadcrumb.component';
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {TranslateModule} from "@ngx-translate/core";
import {PLATFORM_ID} from "@angular/core";
import {ActivatedRoute} from "@angular/router";

describe('BreadcrumbComponent', () => {
  let component: BreadcrumbComponent;
  let fixture: ComponentFixture<BreadcrumbComponent>;

  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbComponent, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [{ provide: ActivatedRoute, useValue: {} }]
    })
      .compileComponents();

    fixture = TestBed.createComponent(BreadcrumbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it("should not skip entry animation", async() => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbComponent, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' },
                  { provide: ActivatedRoute, useValue: {} }],
    })
      .compileComponents();

    fixture = TestBed.createComponent(BreadcrumbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component['skipEntryAnimation']).toBeFalsy();
  });
});
