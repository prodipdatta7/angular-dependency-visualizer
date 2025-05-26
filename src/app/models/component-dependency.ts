export interface ComponentDependency {
  itemId: string;
  name: string;
  filePath: string;
  metadata?: Record<string, string>;
}

export interface DependencyLink {
  sourceId: string;
  targetId: string;
  type: string;
}

export interface DependencyGraph {
  components: ComponentDependency[];
  dependencies: DependencyLink[];
}

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  filePath: string;
  radius: number;
  color: string;
  metadata?: Record<string, string>;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
}