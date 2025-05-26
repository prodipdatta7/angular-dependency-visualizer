import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ComponentDependency } from '../../models/component-dependency';

@Component({
  selector: 'app-dependency-details',
  imports: [],
  templateUrl: './dependency-details.component.html',
  styleUrl: './dependency-details.component.scss'
})
export class DependencyDetailsComponent implements OnChanges {
  @Input() component: ComponentDependency | null = null;
  @Input() allComponents: ComponentDependency[] = [];
  @Input() dependencies: ComponentDependency[] = [];
  @Input() dependents: ComponentDependency[] = [];

  activeTab = 'overview';

  tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'source', name: 'Source' },
    { id: 'metadata', name: 'Metadata' }
  ];

  mockSourceCode = `
  import { Component, OnInit } from '@angular/core';

  @Component({
    selector: 'app-sample',
    templateUrl: './sample.component.html',
    styleUrls: ['./sample.component.scss']
  })
  export class SampleComponent implements OnInit {
    constructor() { }

    ngOnInit(): void {
      console.log('Component initialized');
    }
  }`;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['component'] && this.component) {
      // Extract or compute details from the dependency input
      this.activeTab = 'overview';
      this.mockSourceCode = this.getMockSourceCode(this.component);
    }
  }

  getMetadataEntries(): { key: string, value: string }[] {
    if (this.component && this.component.metadata) {
      return Object.entries(this.component.metadata).map(([key, value]) => ({ key, value }));
    }
    return [];
  }

  selectComponent(component: ComponentDependency): void {
    console.log('Selected component:', component);
  }

  private getMockSourceCode(component: ComponentDependency): string {
    const name = component.name || 'Component';
    const selector = component.metadata?.['selector'] || `app-${name.replace('Component', '').toLowerCase}`;
    
    return `
    import { Component, OnInit } from '@angular/core';

    @Component({
      selector: '${selector}',
      templateUrl: './${name.replace('Component', '').toLowerCase()}.component.html',
      styleUrls: ['./${name.replace('Component', '').toLowerCase()}.component.scss']
    })
    export class ${name} implements OnInit {
      constructor() { }

      ngOnInit(): void {
        console.log('${name} initialized');
      }
    }`;
  }
}