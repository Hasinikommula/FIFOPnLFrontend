import { TestBed } from '@angular/core/testing';

import { FifoPlService } from './fifo-pl.service';

describe('FifoPlService', () => {
  let service: FifoPlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FifoPlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
