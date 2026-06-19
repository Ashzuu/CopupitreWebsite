import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/service/auth.service';
import { BaseLayout } from '../../layout/base-layout/base-layout';

@Component({
  selector: 'copupitre-login-page',
  imports: [ReactiveFormsModule, BaseLayout],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly authService: AuthService = inject(AuthService);

  /** The isLoginMode property. */
  readonly isLoginMode: WritableSignal<boolean> = signal(true);
  /** The errorMessage property. */
  readonly errorMessage: WritableSignal<string> = signal('');

  /** The loginForm property. */
  readonly loginForm = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  /** The registerForm property. */
  readonly registerForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    mainInstrument: ['', Validators.required],
    secondaryInstruments: [''], // Optionnel
    musicalDescription: [''], // Optionnel
    yearsOfPractice: [null as number | null], // Optionnel
  });

  /** Executes the toggleMode action. */
  toggleMode() {
    this.isLoginMode.update((mode) => !mode);
    this.errorMessage.set('');
  }

  /** Executes the onSubmitLogin action. */
  onSubmitLogin() {
    if (this.loginForm.valid) {
      const username = this.loginForm.getRawValue().identifier;
      const mockToken = 'mock.' + btoa(JSON.stringify({ sub: username })) + '.mock';
      this.authService.login(mockToken);
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  /** Executes the onSubmitRegister action. */
  onSubmitRegister() {
    if (this.registerForm.valid) {
      const formValue = this.registerForm.getRawValue();
      const mockToken = 'mock.' + btoa(JSON.stringify({ sub: formValue.username })) + '.mock';
      this.authService.login(mockToken);
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
