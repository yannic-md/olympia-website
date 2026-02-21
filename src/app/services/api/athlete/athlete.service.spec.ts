import { TestBed } from '@angular/core/testing';

import { AthleteService } from './athlete.service';

describe('CountryService', () => {
  let service: AthleteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AthleteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
