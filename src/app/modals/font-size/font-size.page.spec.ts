import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FontSizePage } from './font-size.page';

describe('FontSizePage', () => {
  let component: FontSizePage;
  let fixture: ComponentFixture<FontSizePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FontSizePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
