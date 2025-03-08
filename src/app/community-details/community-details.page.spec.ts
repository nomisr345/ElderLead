import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommunityDetailsPage } from './community-details.page';

describe('CommunityDetailsPage', () => {
  let component: CommunityDetailsPage;
  let fixture: ComponentFixture<CommunityDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunityDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
