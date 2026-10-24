import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { BaseLayout } from './base-layout';

describe('BaseLayout', () => {
  let component: BaseLayout;
  let fixture: ComponentFixture<BaseLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseLayout],
      providers: [
        provideRouter([]),
        provideHttpClient(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BaseLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
