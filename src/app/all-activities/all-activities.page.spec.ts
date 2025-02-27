import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AllActivitiesPage } from './all-activities.page';

describe('AllActivitiesPage', () => {
  let component: AllActivitiesPage;
  let fixture: ComponentFixture<AllActivitiesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AllActivitiesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
