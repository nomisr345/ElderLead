import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddSchemePage } from './add-scheme.page';

describe('AddSchemePage', () => {
  let component: AddSchemePage;
  let fixture: ComponentFixture<AddSchemePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSchemePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
