import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditSchemePage } from './edit-scheme.page';

describe('EditSchemePage', () => {
  let component: EditSchemePage;
  let fixture: ComponentFixture<EditSchemePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSchemePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
