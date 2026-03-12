import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ModalRegisterComponent } from './modal-register.component';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TranslateModule } from "@ngx-translate/core";

describe('ModalRegisterComponent', () => {
  let component: ModalRegisterComponent;
  let fixture: ComponentFixture<ModalRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalRegisterComponent, HttpClientTestingModule, TranslateModule.forRoot()],
    })
      .compileComponents();

    fixture = TestBed.createComponent(ModalRegisterComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('signals initialization', () => {
    it('should initialize with empty form data', () => {
      expect(component['formData']()).toEqual({
        username: '',
        password: '',
        confirmPassword: ''
      });
    });

    it('should initialize isClosing as false', () => {
      expect(component['isClosing']()).toBe(false);
    });
  });

  describe('isFormValid computed signal', () => {
    it('should return false when username is too short', () => {
      component['formData'].set({
        username: 'ab',
        password: 'password123',
        confirmPassword: 'password123'
      });

      expect(component['isFormValid']()).toBe(false);
    });

    it('should return false when username is only whitespace', () => {
      component['formData'].set({
        username: '   ',
        password: 'password123',
        confirmPassword: 'password123'
      });

      expect(component['isFormValid']()).toBe(false);
    });

    it('should return false when password is too short', () => {
      component['formData'].set({
        username: 'validuser',
        password: '12345',
        confirmPassword: '12345'
      });

      expect(component['isFormValid']()).toBe(false);
    });

    it('should return false when passwords do not match', () => {
      component['formData'].set({
        username: 'validuser',
        password: 'password123',
        confirmPassword: 'different123'
      });

      expect(component['isFormValid']()).toBe(false);
    });

    it('should return true when all conditions are met', () => {
      component['formData'].set({
        username: 'validuser',
        password: 'password123',
        confirmPassword: 'password123'
      });

      expect(component['isFormValid']()).toBe(true);
    });

    it('should return true with minimum valid lengths', () => {
      component['formData'].set({
        username: 'abc',
        password: '123456',
        confirmPassword: '123456'
      });

      expect(component['isFormValid']()).toBe(true);
    });
  });

  describe('passwordsMatch computed signal', () => {
    it('should return true when passwords match', () => {
      component['formData'].set({
        username: 'user',
        password: 'password',
        confirmPassword: 'password'
      });

      expect(component['passwordsMatch']()).toBe(true);
    });

    it('should return true when confirmPassword is empty', () => {
      component['formData'].set({
        username: 'user',
        password: 'password',
        confirmPassword: ''
      });

      expect(component['passwordsMatch']()).toBe(true);
    });

    it('should return false when passwords do not match and confirmPassword is not empty', () => {
      component['formData'].set({
        username: 'user',
        password: 'password123',
        confirmPassword: 'different'
      });

      expect(component['passwordsMatch']()).toBe(false);
    });
  });

  describe('close', () => {
    it('should set isClosing to true, reset form and emit closeModal after 200ms', fakeAsync(() => {
      component['formData'].set({
        username: 'testuser',
        password: 'testpass',
        confirmPassword: 'testpass'
      });

      const closeModalSpy = jest.spyOn(component.closeModal, 'emit');

      component['close']();

      expect(component['isClosing']()).toBe(true);

      tick(199);
      expect(component['formData']().username).toBe('testuser');
      expect(closeModalSpy).not.toHaveBeenCalled();

      tick(1);

      expect(component['isClosing']()).toBe(false);
      expect(component['formData']()).toEqual({
        username: '',
        password: '',
        confirmPassword: ''
      });
      expect(closeModalSpy).toHaveBeenCalledTimes(1);
    }));
  });

  describe('onSubmit', () => {
    it('should not emit registerUser when form is invalid', () => {
      component['formData'].set({
        username: 'ab',
        password: 'short',
        confirmPassword: 'short'
      });

      const registerUserSpy = jest.spyOn(component.registerUser, 'emit');
      const closeSpy = jest.spyOn(component as any, 'close');

      component['onSubmit']();

      expect(registerUserSpy).not.toHaveBeenCalled();
      expect(closeSpy).not.toHaveBeenCalled();
    });

    it('should emit registerUser and close modal when form is valid', fakeAsync(() => {
      const formData = {
        username: 'validuser',
        password: 'validpass123',
        confirmPassword: 'validpass123'
      };

      component['formData'].set(formData);

      const registerUserSpy = jest.spyOn(component.registerUser, 'emit');
      const closeModalSpy = jest.spyOn(component.closeModal, 'emit');

      component['onSubmit']();

      expect(registerUserSpy).toHaveBeenCalledWith(formData);
      expect(component['isClosing']()).toBe(true);

      tick(200);

      expect(component['isClosing']()).toBe(false);
      expect(closeModalSpy).toHaveBeenCalled();
    }));
  });
});
