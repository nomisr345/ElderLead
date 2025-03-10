import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SchemeDetailsPage } from './scheme-details.page';

describe('SchemeDetailsPage', () => {
  let component: SchemeDetailsPage;
  let fixture: ComponentFixture<SchemeDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemeDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
