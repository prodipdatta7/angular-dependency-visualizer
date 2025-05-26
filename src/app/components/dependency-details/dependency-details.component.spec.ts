import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DependencyDetailsComponent } from './dependency-details.component';

describe('DependencyDetailsComponent', () => {
  let component: DependencyDetailsComponent;
  let fixture: ComponentFixture<DependencyDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DependencyDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DependencyDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
