import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DisciplineWinnerRowComponent } from './discipline-winner-row.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../../../services/api/auth/auth.service';
import { DisciplineWinner } from '../../../types/Disciplines';

describe('DisciplineWinnerRowComponent', () => {
  let component: DisciplineWinnerRowComponent;
  let fixture: ComponentFixture<DisciplineWinnerRowComponent>;
  let authService: AuthService;
  let translateService: TranslateService;

  const winner: DisciplineWinner = {
    name: 'Jane Doe',
    countryCode: 'DE',
    countryName: 'Germany',
    result: '12',
    scoreType: 'PTS',
  };

  const setRequiredInputs = (
    overrides?: Partial<{
      medal: string;
      medalType: 'gold' | 'silver' | 'bronze';
      activeFilter: 'all' | 'gold' | 'silver' | 'bronze';
      winner: DisciplineWinner | null;
    }>
  ): void => {
    fixture.componentRef.setInput('medal', overrides?.medal ?? 'Gold');
    fixture.componentRef.setInput('medalType', overrides?.medalType ?? 'gold');
    fixture.componentRef.setInput('activeFilter', overrides?.activeFilter ?? 'all');
    fixture.componentRef.setInput('winner', overrides?.winner ?? winner);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisciplineWinnerRowComponent, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: (): boolean => false,
          },
        },
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(DisciplineWinnerRowComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    translateService = TestBed.inject(TranslateService);
  });

  it('should create', () => {
    setRequiredInputs();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should format result for PTS and WINS with translated suffix, strip legacy suffixes, and keep TIME as raw', () => {
    const instantSpy = jest.spyOn(translateService, 'instant').mockImplementation((key: string | string[]) => {
      if (key === 'MODAL.ATHLETE.POINTS') return 'Points';
      if (key === 'MODAL.ATHLETE.WINS') return 'Wins';
      return key;
    });

    const ptsWinner: DisciplineWinner = { ...winner, result: '40 pts', scoreType: 'PTS' };
    const winsWinner: DisciplineWinner = { ...winner, result: '7 WINS', scoreType: 'WINS' };
    const timeWinner: DisciplineWinner = { ...winner, result: '10.23', scoreType: 'TIME' };
    const emptyWinner: DisciplineWinner = { ...winner, result: null, scoreType: 'PTS' } as any;

    expect((component as any).formatResult(ptsWinner)).toBe('40 Points');
    expect((component as any).formatResult(winsWinner)).toBe('7 Wins');
    expect((component as any).formatResult(timeWinner)).toBe('10.23');
    expect((component as any).formatResult(emptyWinner)).toBe('');
    expect(instantSpy).toHaveBeenCalledWith('MODAL.ATHLETE.POINTS');
    expect(instantSpy).toHaveBeenCalledWith('MODAL.ATHLETE.WINS');
  });

  it('should emit deleteWinner with the current medal type when delete button is clicked', () => {
    jest.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
    setRequiredInputs({ medalType: 'silver', activeFilter: 'all', winner: { ...winner } });
    fixture.detectChanges();

    const emitSpy = jest.spyOn(component.deleteWinner, 'emit');
    const button = fixture.debugElement.query(By.css('button'));
    button.triggerEventHandler('click', new Event('click'));

    expect(emitSpy).toHaveBeenCalledWith('silver');
  });
});
