import { TestBed } from '@angular/core/testing';

import { DependencyGraphService } from './dependency-graph.service';

describe('DependencyGraphService', () => {
  let service: DependencyGraphService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DependencyGraphService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
