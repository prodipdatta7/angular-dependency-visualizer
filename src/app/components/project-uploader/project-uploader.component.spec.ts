import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectUploaderComponent } from './project-uploader.component';

describe('ProjectUploaderComponent', () => {
  let component: ProjectUploaderComponent;
  let fixture: ComponentFixture<ProjectUploaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectUploaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
