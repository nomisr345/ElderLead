import { TestBed } from '@angular/core/testing';

import { BookedActivitiesService } from './booked-activities.service';

describe('BookedActivitiesService', () => {
  let service: BookedActivitiesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BookedActivitiesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
