import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookedActivitiesPage } from './booked-activities.page';

describe('BookedActivitiesPage', () => {
  let component: BookedActivitiesPage;
  let fixture: ComponentFixture<BookedActivitiesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BookedActivitiesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
