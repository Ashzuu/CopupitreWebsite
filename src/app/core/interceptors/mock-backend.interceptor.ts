import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of } from 'rxjs';

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('/api/')) {
    let body: any = null;

    if (
      req.method === 'POST' &&
      (req.url === '/api/reinforcements' ||
        req.url === '/api/organizations' ||
        req.url === '/api/equipment-requests')
    ) {
      body = { id: 999, success: true };
    } else if (req.url === '/api/users/me/organizations') {
      body = [
        {
          id: 1,
          name: 'Orchestre Symphonique de Paris',
          city: 'Paris',
          description: 'Ensemble amateur de bon niveau.',
          adminUsernames: ['user'],
          rehearsalSchedules: [
            {
              id: 1,
              dayOfWeek: 'THURSDAY',
              startTime: '19:30',
              endTime: '22:00',
              location: 'Salle 1',
            },
          ],
        },
      ];
    } else if (req.url === '/api/reinforcements' || req.url === '/api/reinforcements/all') {
      body = [
        {
          id: 1,
          title: 'Recherche Violon 1',
          organizationName: 'Orchestre Philharmonique',
          instrumentNeeded: 'Violon',
          eventDate: '2026-08-15',
          deadline: '2026-08-01',
          location: 'Lyon',
          description: "Concert d'été",
          requiredCount: 2,
          validatedCount: 0,
          status: 'OPEN',
          createdAt: new Date().toISOString(),
        },
      ];
    } else if (req.url === '/api/equipment-requests' || req.url === '/api/equipment-requests/all') {
      body = [
        {
          id: 1,
          title: 'Prêt de Timbales',
          organizationId: 1,
          organizationName: 'Orchestre Symphonique de Paris',
          equipmentName: 'Jeu de Timbales',
          duration: '1 jour',
          eventDates: ['2026-09-20'],
          status: 'OPEN',
          description: 'Besoin de timbales pour un raccord.',
        },
      ];
    } else if (req.url === '/api/users/me/reinforcements') {
      body = [
        {
          id: 2,
          title: 'Besoin de Trompettes',
          organizationName: 'Orchestre Symphonique de Paris',
          instrumentNeeded: 'Trompette',
          eventDate: '2026-09-20',
          deadline: '2026-09-10',
          location: 'Paris',
          description: 'Concert de rentrée',
          requiredCount: 1,
          validatedCount: 1,
          status: 'OBJECTIVE_MET',
          createdAt: new Date().toISOString(),
        },
      ];
    } else if (req.url.match(new RegExp('^/api/reinforcements/\\d+/responses$'))) {
      body = [
        {
          id: 1,
          announcementId: 2,
          announcementTitle: 'Besoin de Trompettes',
          respondentUsername: 'trompettiste_pro',
          respondedAt: new Date().toISOString(),
          status: 'ACCEPTED',
        },
      ];
    } else if (req.url.match(new RegExp('^/api/organizations/\\d+/reinforcements$'))) {
      body = [
        {
          id: 1,
          title: 'Recherche Violon 1',
          organizationName: 'Orchestre Philharmonique',
          instrumentNeeded: 'Violon',
          eventDate: '2026-08-15',
          deadline: '2026-08-01',
          location: 'Lyon',
          description: "Concert d'été",
          requiredCount: 2,
          validatedCount: 0,
          status: 'OPEN',
          createdAt: new Date().toISOString(),
        },
      ];
    } else if (req.url.match(new RegExp('^/api/organizations/\\d+/equipment-requests$'))) {
      body = [
        {
          id: 1,
          title: 'Prêt de Timbales',
          organizationId: 1,
          organizationName: 'Orchestre Symphonique de Paris',
          equipmentName: 'Jeu de Timbales',
          duration: '1 jour',
          eventDates: ['2026-09-20'],
          status: 'OPEN',
          description: 'Besoin de timbales pour un raccord.',
        },
      ];
    } else if (req.url.match(new RegExp('^/api/organizations/\\d+$'))) {
      body = {
        id: 1,
        name: 'Orchestre Philharmonique',
        city: 'Lyon',
        description: 'Grand orchestre symphonique regroupant plus de 80 musiciens.',
        adminUsernames: ['chef_orchestre'],
        rehearsalSchedules: [
          {
            id: 1,
            dayOfWeek: 'WEDNESDAY',
            startTime: '20:00',
            endTime: '22:30',
            location: 'Conservatoire de Lyon',
          },
        ],
        concerts: [],
        annualNeeds: [],
      };
    }

    if (body !== null) {
      return of(new HttpResponse({ status: 200, body })).pipe(delay(800));
    }
  }
  return next(req);
};
