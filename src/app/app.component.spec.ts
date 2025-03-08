import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
<<<<<<< HEAD
=======

>>>>>>> d01a5672c4fa3b4eb521cf85f686634ea7a5ac07
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
<<<<<<< HEAD
});
=======

});
>>>>>>> d01a5672c4fa3b4eb521cf85f686634ea7a5ac07
