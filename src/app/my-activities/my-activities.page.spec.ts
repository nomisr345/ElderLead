import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyActivitiesPage } from './my-activities.page';

describe('MyActivitiesPage', () => {
  let component: MyActivitiesPage;
  let fixture: ComponentFixture<MyActivitiesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MyActivitiesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
