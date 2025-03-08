import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommunitySetupPage } from './community-setup.page';

describe('CommunitySetupPage', () => {
  let component: CommunitySetupPage;
  let fixture: ComponentFixture<CommunitySetupPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunitySetupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
