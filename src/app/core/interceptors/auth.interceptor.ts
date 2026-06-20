import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../service/auth.service';

/**
 * Ce que fait la nouvelle classe : Intercepteur HTTP (fonctionnel).
 * Dans quel but elle a été créée : Intercepter chaque requête sortante pour y ajouter le token JWT dans l'en-tête Authorization.
 * À quoi celle-ci est-elle liée : Elle utilise AuthService pour récupérer le token.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }

  return next(req);
};
