import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoaderService } from '@services/loader-service';
import { BaseLayout } from '@layouts/base-layout/base-layout';
import { ReinforcementList } from '@pages/dashboard/components/reinforcement-list/reinforcement-list';
import { ScheduleTable } from '@pages/dashboard/components/schedule-table/schedule-table';
import { MyAnnouncementsPanel } from '@pages/dashboard/components/my-announcements-panel/my-announcements-panel';
import { OrganizationDetailService } from './data/organization-detail-service';
import { AuthService } from '@services/auth-service';
import { OrganizationRepository } from '@repositories/organization-repository';
import { NotifService } from '@services/notif-service';
import {
  Absence,
  AbsenceStatus,
  CreateAbsenceRequest,
  CreateMusicianRequest,
  CsvImportResult,
  EventType,
  Musician,
} from '@models/index';

@Component({
  selector: 'copupitre-organization-detail-page',
  imports: [
    BaseLayout,
    ScheduleTable,
    ReinforcementList,
    MyAnnouncementsPanel,
    DatePipe,
    RouterLink,
    FormsModule,
  ],
  providers: [OrganizationDetailService],
  templateUrl: './organization-detail-page.html',
  styleUrl: './organization-detail-page.scss',
})
export class OrganizationDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly service = inject(OrganizationDetailService);
  readonly loaderService = inject(LoaderService);
  readonly authService = inject(AuthService);
  private readonly orgRepo = inject(OrganizationRepository);
  private readonly notifService = inject(NotifService);

  readonly activeTab = signal<'general' | 'admin' | 'absences'>('general');

  // --- Administration - Admins ---
  readonly newAdminUsername = signal('');
  readonly isSubmittingAdmin = signal(false);

  // --- Administration - Musiciens (Epic 02) ---
  readonly showAddMusicianForm = signal(false);
  readonly isSubmittingMusician = signal(false);
  readonly newMusician = signal<CreateMusicianRequest>({
    firstName: '',
    lastName: '',
    email: '',
    instrument: '',
  });

  readonly showCsvModal = signal(false);
  readonly isImportingCsv = signal(false);
  readonly selectedCsvFile = signal<File | null>(null);
  readonly csvImportResult = signal<CsvImportResult | null>(null);

  readonly showAssociateModal = signal(false);
  readonly associatingMusician = signal<Musician | null>(null);
  readonly associateEmail = signal('');
  readonly isAssociatingUser = signal(false);

  // --- Absences (Epic 07) ---
  readonly selectedPeriod = signal<'1m' | '3m' | '6m' | 'custom'>('1m');
  readonly periodStartDate = signal<string>('');
  readonly periodEndDate = signal<string>('');
  readonly filterEventType = signal<EventType | ''>('');
  readonly filterStatus = signal<AbsenceStatus | ''>('');
  readonly filterMusicianId = signal<number | null>(null);

  readonly showAbsenceModal = signal(false);
  readonly isSubmittingAbsence = signal(false);
  readonly newAbsenceData = signal<{
    musicianId: number | null;
    eventType: EventType;
    eventDate: string;
    endDate: string;
    reason: string;
    status: AbsenceStatus;
  }>({
    musicianId: null,
    eventType: 'REHEARSAL',
    eventDate: '',
    endDate: '',
    reason: '',
    status: 'JUSTIFIED',
  });

  readonly showCancelEventModal = signal(false);
  readonly isSubmittingCancelEvent = signal(false);
  readonly cancelEventData = signal<{
    eventType: EventType;
    eventDate: string;
    message: string;
  }>({
    eventType: 'REHEARSAL',
    eventDate: '',
    message: '',
  });

  readonly isAdmin = computed(() => {
    const org = this.service.organization();
    if (!org || !org.adminUsernames) return false;
    const username = this.authService.currentUsername();
    const fullName = this.authService.currentUserFullName();
    return (
      (!!username && org.adminUsernames.includes(username)) ||
      (!!fullName && org.adminUsernames.includes(fullName))
    );
  });

  readonly currentConnectedMusician = computed(() => {
    const currentUsername = this.authService.currentUsername();
    if (!currentUsername) return null;
    return this.service.musicians().find(
      (m) => m.username?.toLowerCase() === currentUsername.toLowerCase()
    ) || null;
  });

  readonly canAccessAbsences = computed(() => {
    return this.isAdmin() || !!this.currentConnectedMusician();
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.service.loadOrganizationData(idParam);
    }
  }

  setTab(tab: 'general' | 'admin' | 'absences') {
    this.activeTab.set(tab);
    const org = this.service.organization();
    if (org) {
      if (tab === 'admin') {
        this.service.loadMusicians(org.id);
      } else if (tab === 'absences') {
        this.service.loadMusicians(org.id);
        this.loadAbsenceData();
      }
    }
  }

  contactOrganization() {
    if (!this.authService.isAuthenticated()) {
      this.notifService.showWarning(
        'Veuillez vous connecter pour contacter cette organisation.',
        'Connexion requise',
      );
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/messagerie']);
  }

  // ==========================================
  // US-ORG-08: Gestion des administrateurs
  // ==========================================
  addAdmin() {
    const org = this.service.organization();
    const username = this.newAdminUsername().trim();

    if (!org || !username) {
      this.notifService.showWarning("Veuillez saisir un nom d'utilisateur ou pseudo.");
      return;
    }

    if (org.adminUsernames?.includes(username)) {
      this.notifService.showWarning('Cet utilisateur est déjà administrateur de cette organisation.');
      return;
    }

    this.isSubmittingAdmin.set(true);
    this.orgRepo.addAdmin(org.id, username).subscribe({
      next: (updatedOrg) => {
        this.isSubmittingAdmin.set(false);
        this.newAdminUsername.set('');
        if (updatedOrg && updatedOrg.adminUsernames) {
          this.service.organization.set(updatedOrg);
        } else {
          this.service.organization.update((current) =>
            current
              ? {
                  ...current,
                  adminUsernames: [...(current.adminUsernames || []), username],
                }
              : null,
          );
        }
        this.notifService.showSuccess(`L'administrateur "${username}" a bien été ajouté.`);
      },
      error: (err) => {
        this.isSubmittingAdmin.set(false);
        if (!err?._notificationShown) {
          const msg = err?.error?.message || err?.error?.error || "Impossible d'ajouter cet administrateur. Vérifiez que l'utilisateur existe.";
          this.notifService.showError(msg, "Erreur lors de l'ajout");
        }
      },
    });
  }

  isCurrentUser(username: string): boolean {
    if (!username) return false;
    const currentUsername = this.authService.currentUsername();
    const currentUserFullName = this.authService.currentUserFullName();
    return (
      (!!currentUsername && currentUsername.toLowerCase() === username.toLowerCase()) ||
      (!!currentUserFullName && currentUserFullName.toLowerCase() === username.toLowerCase())
    );
  }

  removeAdmin(username: string) {
    const org = this.service.organization();
    if (!org) return;

    if (this.isCurrentUser(username)) {
      this.notifService.showWarning('Vous ne pouvez pas vous retirer vous-même des administrateurs.');
      return;
    }

    if ((org.adminUsernames?.length ?? 0) <= 1) {
      this.notifService.showWarning("Impossible de retirer le seul administrateur de l'organisation.");
      return;
    }

    const confirmed = typeof window !== 'undefined' ? window.confirm(`Êtes-vous sûr de vouloir retirer "${username}" des administrateurs ?`) : true;
    if (!confirmed) return;

    this.orgRepo.removeAdmin(org.id, username).subscribe({
      next: (updatedOrg) => {
        if (updatedOrg && updatedOrg.adminUsernames) {
          this.service.organization.set(updatedOrg);
        } else {
          this.service.organization.update((current) =>
            current
              ? {
                  ...current,
                  adminUsernames: (current.adminUsernames || []).filter((u) => u !== username),
                }
              : null,
          );
        }
        this.notifService.showSuccess(`L'administrateur "${username}" a bien été retiré.`);
      },
      error: (err) => {
        if (!err?._notificationShown) {
          const msg = err?.error?.message || err?.error?.error || "Impossible de retirer cet administrateur.";
          this.notifService.showError(msg, 'Erreur lors du retrait');
        }
      },
    });
  }

  // ==========================================
  // EPIC 02: Gestion des Musiciens
  // ==========================================
  toggleAddMusicianForm() {
    this.showAddMusicianForm.update((v) => !v);
  }

  submitAddMusician() {
    const org = this.service.organization();
    const req = this.newMusician();
    if (!org || !req.firstName.trim() || !req.lastName.trim() || !req.email.trim() || !req.instrument.trim()) {
      this.notifService.showWarning('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    this.isSubmittingMusician.set(true);
    this.service
      .addMusician(org.id, req)
      .then((created) => {
        this.isSubmittingMusician.set(false);
        this.showAddMusicianForm.set(false);
        this.newMusician.set({ firstName: '', lastName: '', email: '', instrument: '' });
        this.notifService.showSuccess(`Le musicien ${created.firstName} ${created.lastName} a été ajouté avec succès.`);
      })
      .catch((err) => {
        this.isSubmittingMusician.set(false);
        const msg = err?.error?.message || err?.error?.error || "Erreur lors de l'ajout du musicien.";
        this.notifService.showError(msg, 'Erreur');
      });
  }

  openCsvModal() {
    this.selectedCsvFile.set(null);
    this.csvImportResult.set(null);
    this.showCsvModal.set(true);
  }

  closeCsvModal() {
    this.showCsvModal.set(false);
  }

  onCsvFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedCsvFile.set(input.files[0]);
    }
  }

  submitCsvImport() {
    const org = this.service.organization();
    const file = this.selectedCsvFile();
    if (!org || !file) {
      this.notifService.showWarning('Veuillez sélectionner un fichier CSV.');
      return;
    }

    this.isImportingCsv.set(true);
    this.service
      .importCsv(org.id, file)
      .then((res) => {
        this.isImportingCsv.set(false);
        this.csvImportResult.set(res);
        this.notifService.showSuccess(`Importation terminée : ${res.importedCount} musiciens importés, ${res.skippedCount} ignorés.`);
      })
      .catch((err) => {
        this.isImportingCsv.set(false);
        const msg = err?.error?.message || err?.error?.error || "Erreur lors de l'import CSV.";
        this.notifService.showError(msg, 'Erreur');
      });
  }

  deleteMusician(musician: Musician) {
    const org = this.service.organization();
    if (!org) return;

    const confirmed = typeof window !== 'undefined'
      ? window.confirm(`Voulez-vous retirer ${musician.firstName} ${musician.lastName} de l'organisation ? (L'historique sera conservé)`)
      : true;
    if (!confirmed) return;

    this.service
      .removeMusician(org.id, musician.id)
      .then(() => {
        this.notifService.showSuccess(`Le musicien ${musician.firstName} ${musician.lastName} a été retiré.`);
      })
      .catch((err) => {
        const msg = err?.error?.message || err?.error?.error || 'Erreur lors du retrait du musicien.';
        this.notifService.showError(msg, 'Erreur');
      });
  }

  openAssociateModal(musician: Musician) {
    this.associatingMusician.set(musician);
    this.associateEmail.set(musician.email || '');
    this.showAssociateModal.set(true);
  }

  closeAssociateModal() {
    this.showAssociateModal.set(false);
    this.associatingMusician.set(null);
  }

  submitAssociateUser() {
    const org = this.service.organization();
    const musician = this.associatingMusician();
    const email = this.associateEmail().trim();

    if (!org || !musician || !email) {
      this.notifService.showWarning("Veuillez saisir une adresse email valide d'utilisateur.");
      return;
    }

    this.isAssociatingUser.set(true);
    this.service
      .associateUser(org.id, musician.id, email)
      .then((updated) => {
        this.isAssociatingUser.set(false);
        this.closeAssociateModal();
        this.notifService.showSuccess(`Le musicien a bien été lié au compte utilisateur ${updated.username || email}.`);
      })
      .catch((err) => {
        this.isAssociatingUser.set(false);
        const msg = err?.error?.message || err?.error?.error || "Impossible d'associer cet utilisateur. Vérifiez l'adresse email.";
        this.notifService.showError(msg, 'Erreur association');
      });
  }

  // ==========================================
  // EPIC 07: Gestion des Absences
  // ==========================================
  loadAbsenceData() {
    const org = this.service.organization();
    if (!org) return;

    const { start, end } = this.calculatePeriodDates();
    this.service.loadAbsenceStats(org.id, start, end);

    const filters: {
      startDate?: string;
      endDate?: string;
      eventType?: EventType;
      status?: AbsenceStatus;
      musicianId?: number;
    } = {};

    if (start) filters.startDate = start;
    if (end) filters.endDate = end;
    if (this.filterEventType()) filters.eventType = this.filterEventType() as EventType;
    if (this.filterStatus()) filters.status = this.filterStatus() as AbsenceStatus;
    if (this.filterMusicianId()) filters.musicianId = this.filterMusicianId() as number;

    this.service.loadAbsences(org.id, filters);
  }

  calculatePeriodDates(): { start?: string; end?: string } {
    const period = this.selectedPeriod();
    const today = new Date();

    if (period === 'custom') {
      return {
        start: this.periodStartDate() || undefined,
        end: this.periodEndDate() || undefined,
      };
    }

    const past = new Date(today);
    if (period === '1m') {
      past.setMonth(today.getMonth() - 1);
    } else if (period === '3m') {
      past.setMonth(today.getMonth() - 3);
    } else if (period === '6m') {
      past.setMonth(today.getMonth() - 6);
    }

    const start = past.toISOString().split('T')[0];
    const end = today.toISOString().split('T')[0];
    return { start, end };
  }

  setPeriod(period: '1m' | '3m' | '6m' | 'custom') {
    this.selectedPeriod.set(period);
    this.loadAbsenceData();
  }

  openAbsenceModal(defaultEventType: EventType = 'REHEARSAL', defaultDate: string = '') {
    const org = this.service.organization();
    if (org && this.service.musicians().length === 0) {
      this.service.loadMusicians(org.id);
    }
    const connectedMusician = this.currentConnectedMusician();
    const defaultMusicianId = connectedMusician ? connectedMusician.id : (this.service.musicians()[0]?.id || null);

    this.newAbsenceData.set({
      musicianId: defaultMusicianId,
      eventType: defaultEventType,
      eventDate: defaultDate || new Date().toISOString().split('T')[0],
      endDate: '',
      reason: '',
      status: 'JUSTIFIED',
    });
    this.showAbsenceModal.set(true);
  }

  closeAbsenceModal() {
    this.showAbsenceModal.set(false);
  }

  submitAbsence() {
    const org = this.service.organization();
    const data = this.newAbsenceData();
    if (!org || !data.musicianId || !data.eventDate || !data.reason.trim()) {
      this.notifService.showWarning('Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    const req: CreateAbsenceRequest = {
      musicianId: data.musicianId,
      eventType: data.eventType,
      eventDate: data.eventDate,
      endDate: data.endDate || null,
      reason: data.reason.trim(),
      status: this.isAdmin() ? data.status : undefined,
    };

    this.isSubmittingAbsence.set(true);
    this.service
      .registerAbsence(org.id, req)
      .then((created) => {
        this.isSubmittingAbsence.set(false);
        this.closeAbsenceModal();
        if (created.status === 'UNJUSTIFIED' && !this.isAdmin()) {
          this.notifService.showWarning(
            "L'absence a été enregistrée avec le statut 'Non justifiée' car le délai de prévenance n'a pas été respecté. L'administrateur a été averti.",
            'Absence hors délai',
          );
        } else {
          this.notifService.showSuccess("L'absence a été enregistrée avec succès.");
        }
        this.loadAbsenceData();
      })
      .catch((err) => {
        this.isSubmittingAbsence.set(false);
        const msg = err?.error?.message || err?.error?.error || "Erreur lors de l'enregistrement de l'absence.";
        this.notifService.showError(msg, 'Erreur');
      });
  }

  changeAbsenceStatus(absence: Absence, newStatus: AbsenceStatus) {
    const org = this.service.organization();
    if (!org) return;

    this.service
      .updateAbsenceStatus(org.id, absence.id, newStatus)
      .then(() => {
        this.notifService.showSuccess(`Le statut de l'absence a été mis à jour vers ${newStatus}.`);
        this.loadAbsenceData();
      })
      .catch((err) => {
        const msg = err?.error?.message || err?.error?.error || 'Erreur lors de la mise à jour du statut.';
        this.notifService.showError(msg, 'Erreur');
      });
  }

  openCancelEventModal(defaultType: EventType = 'REHEARSAL', defaultDate: string = '') {
    this.cancelEventData.set({
      eventType: defaultType,
      eventDate: defaultDate || new Date().toISOString().split('T')[0],
      message: '',
    });
    this.showCancelEventModal.set(true);
  }

  closeCancelEventModal() {
    this.showCancelEventModal.set(false);
  }

  submitCancelEvent() {
    const org = this.service.organization();
    const data = this.cancelEventData();
    if (!org || !data.eventDate || !data.message.trim()) {
      this.notifService.showWarning("Veuillez renseigner la date et le motif de l'annulation.");
      return;
    }

    this.isSubmittingCancelEvent.set(true);
    this.service
      .notifyEventCancellation(org.id, data)
      .then(() => {
        this.isSubmittingCancelEvent.set(false);
        this.closeCancelEventModal();
        this.notifService.showSuccess("Les musiciens de l'organisation ont été notifiés de l'annulation par notification automatique.");
      })
      .catch((err) => {
        this.isSubmittingCancelEvent.set(false);
        const msg = err?.error?.message || err?.error?.error || "Erreur lors de l'envoi de l'annulation.";
        this.notifService.showError(msg, 'Erreur');
      });
  }
}
