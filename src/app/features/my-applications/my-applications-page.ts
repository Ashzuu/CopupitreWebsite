import { DatePipe, LowerCasePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BaseLayout } from '@layouts/base-layout/base-layout';
import { ReinforcementResponse, ResponseStatus } from '@models/reinforcement';
import { ReinforcementsRepository } from '@repositories/reinforcements-repository';
import { PermanentRecruitmentsRepository } from '@repositories/permanent-recruitments-repository';
import { NotifService } from '@services/notif-service';
import { LoggerService } from '@services/logger-service';
import { ConversationService } from '@services/conversation-service';
import { ConversationModal } from '../../core/components/conversation-modal/conversation-modal';
import { forkJoin } from 'rxjs';

export type ApplicationFilterTab = 'ALL' | 'RENFORT' | 'PERMANENT';

@Component({
  selector: 'copupitre-my-applications-page',
  imports: [BaseLayout, RouterLink, DatePipe, LowerCasePipe, ConversationModal],
  templateUrl: './my-applications-page.html',
  styleUrl: './my-applications-page.scss',
})
export class MyApplicationsPage implements OnInit {
  private readonly reinforcementsRepo = inject(ReinforcementsRepository);
  private readonly permanentRepo = inject(PermanentRecruitmentsRepository);
  private readonly notifService = inject(NotifService);
  private readonly logger = inject(LoggerService);
  private readonly route = inject(ActivatedRoute);
  private readonly conversationService = inject(ConversationService);

  /** Loading indicator. */
  loading = signal<boolean>(true);

  /** Active category filter tab. */
  activeTab = signal<ApplicationFilterTab>('ALL');

  /** List of reinforcement applications. */
  reinforcementApplications = signal<ReinforcementResponse[]>([]);

  /** List of permanent recruitment applications. */
  permanentApplications = signal<ReinforcementResponse[]>([]);

  /** Active conversation modal state (US-COM-03). */
  activeConversationApp = signal<ReinforcementResponse | null>(null);

  openConversation(app: ReinforcementResponse): void {
    this.activeConversationApp.set(app);
  }

  closeConversation(): void {
    this.activeConversationApp.set(null);
  }

  /** Combined list of all applications sorted by most recent date. */
  allApplications = computed<ReinforcementResponse[]>(() => {
    const renf = this.reinforcementApplications().map((app) => ({
      ...app,
      type: (app.type || 'RENFORT') as 'RENFORT' | 'PERMANENT',
    }));
    const perm = this.permanentApplications().map((app) => ({
      ...app,
      type: (app.type || 'PERMANENT') as 'RENFORT' | 'PERMANENT',
    }));

    return [...renf, ...perm].sort((a, b) => {
      const dateA = a.respondedAt ? new Date(a.respondedAt).getTime() : 0;
      const dateB = b.respondedAt ? new Date(b.respondedAt).getTime() : 0;
      return dateB - dateA;
    });
  });

  /** Filtered list based on active tab. */
  filteredApplications = computed<ReinforcementResponse[]>(() => {
    const tab = this.activeTab();
    const all = this.allApplications();
    if (tab === 'ALL') return all;
    return all.filter((app) => app.type === tab);
  });

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading.set(true);
    forkJoin({
      reinforcements: this.reinforcementsRepo.getMyApplications(),
      permanents: this.permanentRepo.getMyApplications(),
    }).subscribe({
      next: ({ reinforcements, permanents }) => {
        this.reinforcementApplications.set(reinforcements || []);
        this.permanentApplications.set(permanents || []);
        this.loading.set(false);
        this.checkQueryParams();
      },
      error: (err) => {
        this.logger.error('Erreur lors du chargement des candidatures', 'MyApplicationsPage', err);
        if (!err?._notificationShown) {
          this.notifService.showError('Impossible de charger vos candidatures.');
        }
        this.loading.set(false);
      },
    });
  }

  private checkQueryParams(): void {
    const params = this.route.snapshot.queryParams;
    const type = params['contextType'];
    const id = params['contextId'];
    if (type && id) {
      const targetId = Number(id);
      const isPerm = type === 'ANNUAL_APPLICATION';
      const list = isPerm ? this.permanentApplications() : this.reinforcementApplications();
      const match = list.find((a) => a.id === targetId);
      if (match) {
        this.openConversation(match);
      } else {
        this.conversationService.open({
          contextType: type,
          contextId: targetId,
          title: 'Fil de discussion',
        });
      }
    }
  }

  setTab(tab: ApplicationFilterTab): void {
    this.activeTab.set(tab);
  }

  translateStatus(status: ResponseStatus | string): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Acceptée';
      case 'REJECTED':
        return 'Refusée';
      default:
        return status;
    }
  }

  getMailtoLink(app: ReinforcementResponse): string {
    const email = app.organizationEmail || 'contact@copupitre.fr';
    const subject = encodeURIComponent(
      `Candidature Copupitre - ${app.announcementTitle || 'Annonce'}`
    );
    const body = encodeURIComponent(
      `Bonjour ${app.organizationName || "l'organisation"},\n\n` +
        `Je vous contacte au sujet de ma candidature pour « ${app.announcementTitle || 'votre annonce'} ».\n\n` +
        `Musicalement,\n`
    );
    return `mailto:${email}?subject=${subject}&body=${body}`;
  }
}
