import { TestBed, inject } from '@angular/core/testing';

import { OpenfinService } from './openfin.service';

describe('OpenfinService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OpenfinService]
    });
  });

  it('should be created', inject([OpenfinService], (service: OpenfinService) => {
    expect(service).toBeTruthy();
  }));
});
