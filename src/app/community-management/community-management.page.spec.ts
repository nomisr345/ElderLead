import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommunityManagementPage } from './community-management.page';

describe('CommunityManagementPage', () => {
  let component: CommunityManagementPage;
  let fixture: ComponentFixture<CommunityManagementPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunityManagementPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
