import { Component, EventEmitter, Output } from '@angular/core';
import { DependencyGraphService } from '../../core/services/dependency-graph.service';
import { DependencyGraph } from '../../models/component-dependency';

@Component({
  selector: 'app-project-uploader',
  imports: [],
  templateUrl: './project-uploader.component.html',
  styleUrl: './project-uploader.component.scss'
})
export class ProjectUploaderComponent {
  selectedFile: File | null = null;
  isDragging: boolean = false;
  isAnalyzing: boolean = false;
  error : string | null = null;
  @Output() projectAnalyzed = new EventEmitter<DependencyGraph>();
  constructor(private dependencyGraphService: DependencyGraphService) { }

  onDragOver(event: DragEvent) : void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }
  onDragLeave() : void {
    this.isDragging = false;
  }

  onDrop(event: DragEvent) : void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.validateAndSetFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    const files = element.files;
    
    if (files && files.length > 0) {
      this.validateAndSetFile(files[0]);
    }
  }

  validateAndSetFile(file: File) : void {
    if (!file.name.endsWith('.zip')) {
      this.error = 'Please upload a valid zip file.';
      return;
    }
    this.selectedFile = file;
    this.error = null;
  }

  analyzeProject() : void {
    if (!this.selectedFile) {
      this.error = 'Please select a file to analyze.';
      return;
    }
    this.isAnalyzing = true;
    this.dependencyGraphService.analyzeProject(this.selectedFile).subscribe({
      next: (data) => {
        console.log('Analysis result:', data);
        this.isAnalyzing = false;
        this.projectAnalyzed.emit(data);
      },
      error: (err) => {
        console.error('Error analyzing project:', err);
        this.isAnalyzing = false;
        this.error = 'An error occurred while analyzing the project.';
      }
    });
  }
}
