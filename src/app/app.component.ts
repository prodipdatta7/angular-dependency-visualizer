import { Component } from '@angular/core';
import { ComponentDependency, DependencyGraph } from './models/component-dependency';
import { DependencyGraphService } from './core/services/dependency-graph.service';
import { ProjectUploaderComponent } from './components/project-uploader/project-uploader.component';
import { DependencyDetailsComponent } from './components/dependency-details/dependency-details.component';
import { GraphViewerComponent } from './components/graph-viewer/graph-viewer.component';

@Component({
  selector: 'app-root',
  imports: [ProjectUploaderComponent, DependencyDetailsComponent, GraphViewerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'dependency-visualizer-ui';
  graphData: DependencyGraph | null = null;
  selectedComponent: ComponentDependency | null = null;
  componentDependencies: ComponentDependency[] = [];
  componentDependents: ComponentDependency[] = [];
  showHelp = false;
  
  constructor(private dependencyService: DependencyGraphService) {
    // this.loadMockData();
  }
  
  loadMockData(): void {
    this.dependencyService.getMockData().subscribe(data => {
      this.graphData = data;
    });
  }
  
  onProjectAnalyzed(data: DependencyGraph): void {
    this.graphData = data;
    console.log('Project analyzed:', data);
    this.selectedComponent = null;
    this.componentDependencies = [];
    this.componentDependents = [];
  }
  
  onNodeSelected(component: ComponentDependency): void {
    this.selectedComponent = component;
    
    if (this.graphData) {
      // Find dependencies (components that this component depends on)
      this.componentDependencies = this.graphData.dependencies
        .filter(dep => dep.sourceId === component.itemId)
        .map(dep => this.findComponentById(dep.targetId))
        .filter(comp => comp !== null) as ComponentDependency[];
      
      // Find dependents (components that depend on this component)
      this.componentDependents = this.graphData.dependencies
        .filter(dep => dep.targetId === component.itemId)
        .map(dep => this.findComponentById(dep.sourceId))
        .filter(comp => comp !== null) as ComponentDependency[];
    }
  }
  
  private findComponentById(id: string): ComponentDependency | null {
    if (!this.graphData) return null;
    return this.graphData.components.find(c => c.itemId === id) || null;
  }
}
