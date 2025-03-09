import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourceHubPage } from './resource-hub.page';

describe('ResourceHubPage', () => {
  let component: ResourceHubPage;
  let fixture: ComponentFixture<ResourceHubPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourceHubPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
