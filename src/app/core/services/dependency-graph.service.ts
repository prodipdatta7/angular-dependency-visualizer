import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DependencyGraph } from '../../models/component-dependency';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DependencyGraphService {
  private apiUrl = 'https://localhost:7022/api/DepGraph';

  constructor(private http: HttpClient) { }

  analyzeProject(projectFile: File) {
    const formData = new FormData();
    formData.append('formFile', projectFile);

    return this.http.post<DependencyGraph>(`${this.apiUrl}/analyze`, formData);
  }

  getMockData(): Observable<DependencyGraph> {
    const mockData: DependencyGraph = {
      components: [
        { itemId: 'app', name: 'AppComponent', filePath: 'src/app/app.component.ts' },
        { itemId: 'header', name: 'HeaderComponent', filePath: 'src/app/header/header.component.ts' },
        { itemId: 'footer', name: 'FooterComponent', filePath: 'src/app/footer/footer.component.ts' },
        { itemId: 'dashboard', name: 'DashboardComponent', filePath: 'src/app/dashboard/dashboard.component.ts' },
        { itemId: 'sidebar', name: 'SidebarComponent', filePath: 'src/app/sidebar/sidebar.component.ts' },
      ],
      dependencies: [
        { sourceId: 'app', targetId: 'header', type: 'Standard' },
        { sourceId: 'app', targetId: 'footer', type: 'Standard' },
        { sourceId: 'app', targetId: 'dashboard', type: 'Standard' },
        { sourceId: 'dashboard', targetId: 'sidebar', type: 'Standard' },
      ]
    };
    
    return of(mockData);
  }
}
