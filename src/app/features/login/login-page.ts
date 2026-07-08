import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/service/auth-service';
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

  readonly registerForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
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
    this.errorMessage.set("");
    if (this.loginForm.valid) {
      const { identifier, password } = this.loginForm.getRawValue();
      this.authService.login({ username: identifier, password }).subscribe({
        error: (err) => {
          this.errorMessage.set(err.error?.username || 'Identifiants incorrects');
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  /** Executes the onSubmitRegister action. */
  onSubmitRegister() {
    if (this.registerForm.valid) {
      const formValue = this.registerForm.getRawValue();
      const payload = {
        username: formValue.username,
        email: formValue.email,
        password: formValue.password,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        mainInstrument: formValue.mainInstrument,
        secondaryInstruments: formValue.secondaryInstruments,
        musicalDescription: formValue.musicalDescription,
        yearsOfPractice: formValue.yearsOfPractice,
      };
      this.authService.register(payload).subscribe({
        error: (err) => {
          this.errorMessage.set(err.error?.username || 'Erreur lors de l\'inscription');
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
