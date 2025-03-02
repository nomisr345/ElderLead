import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityConfirmationPage } from './activity-confirmation.page';

describe('ActivityConfirmationPage', () => {
  let component: ActivityConfirmationPage;
  let fixture: ComponentFixture<ActivityConfirmationPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityConfirmationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
