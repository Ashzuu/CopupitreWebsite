import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EquipmentRequestList } from './equipment-request-list';
import { EquipmentRequest } from '@models/equipment-request';

describe('EquipmentRequestList', () => {
  let component: EquipmentRequestList;
  let fixture: ComponentFixture<EquipmentRequestList>;

  const mockRequests: EquipmentRequest[] = [
    {
      id: 1,
      title: 'Prêt de timbales',
      equipmentName: 'Timbales',
      duration: '1 week-end',
      eventDates: ['2026-11-15'],
      organizationId: 10,
      organizationName: 'Harmonie',
      status: 'OPEN',
      description: 'Modalités de transport',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipmentRequestList],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentRequestList);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('requests', mockRequests);
    fixture.detectChanges();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait traduire les statuts correctement', () => {
    expect(component.translateStatus('OPEN')).toBe('En recherche');
    expect(component.translateStatus('MET')).toBe('Trouvé');
    expect(component.translateStatus('CLOSED')).toBe('Clôturé');
    expect(component.translateStatus('UNKNOWN')).toBe('UNKNOWN');
  });

  it('devrait émettre statusChanged lors du clic sur une action de statut', () => {
    let emittedEvent: any = null;
    component.statusChanged.subscribe((e) => {
      emittedEvent = e;
    });

    component.onUpdateStatus(mockRequests[0], 'MET');

    expect(emittedEvent).toEqual({
      request: mockRequests[0],
      status: 'MET',
    });
  });

  it('devrait émettre requestDeleted lors du clic sur suppression', () => {
    let deletedRequest: any = null;
    component.requestDeleted.subscribe((r) => {
      deletedRequest = r;
    });

    component.onDelete(mockRequests[0]);

    expect(deletedRequest).toEqual(mockRequests[0]);
  });
});
