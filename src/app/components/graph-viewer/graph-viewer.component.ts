import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ComponentDependency, DependencyGraph, GraphLink, GraphNode } from '../../models/component-dependency';
import * as d3 from 'd3';

@Component({
  selector: 'app-graph-viewer',
  imports: [],
  templateUrl: './graph-viewer.component.html',
  styleUrl: './graph-viewer.component.scss'
})
export class GraphViewerComponent implements OnInit, OnChanges {
  @Input() graphData: DependencyGraph | null = null;
  @Output() nodeSelected = new EventEmitter<ComponentDependency>();
  @ViewChild('graphContainer', { static: true }) graphContainer!: ElementRef;

  private svg: any;
  private width = 0;
  private height = 0;
  private simulation: any;
  private zoom: any;
  private g: any;
  private colorScale: any;
  private tooltip: any;
  private selectedNode: GraphNode | null = null;
  currentLayout: 'force' | 'tree' | 'radial' = 'tree';
  private nodes: GraphNode[] = [];
  private links: GraphLink[] = [];

  constructor() { }

  ngOnInit(): void {
    console.log('GraphViewerComponent initialized');
    this.initializeGraph();
    window.addEventListener('resize', this.resizeGraph.bind(this));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['graphData'] && this.svg && this.graphData) {
      this.processGraphData(this.graphData);
      this.updateGraph();
    }
  }

  private initializeGraph(): void {
    this.width = this.graphContainer.nativeElement.offsetWidth;
    this.height = this.graphContainer.nativeElement.offsetHeight || 600;

    this.svg = d3.select(this.graphContainer.nativeElement)
      .append('svg')
      .attr('width', '100%')
      .attr('height', this.height)
      .attr('viewBox', [0, 0, this.width, this.height])
      .attr('class', 'dependency-graph');

    this.zoom = d3.zoom()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });

    this.svg.call(this.zoom);

    this.g = this.svg.append('g');

    const defs = this.svg.append('defs');
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    this.colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    this.tooltip = d3.select('body').append('div')
      .attr('class', 'graph-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', 'rgba(0, 0, 0, 0.7)')
      .style('color', 'white')
      .style('font-size', '12px')
      .style('border-radius', '4px')
      .style('padding', '10px');

    if (this.graphData) {
      this.processGraphData(this.graphData);
      this.updateGraph();
    }
  }

  private processGraphData(data: DependencyGraph): void {
    this.nodes = data.components.map(component => ({
      id: component.itemId,
      name: component.name,
      filePath: component.filePath,
      radius: 5,
      color: this.colorScale(component.name.split('.')[0]),
      metadata: component.metadata
    }));

    this.links = data.dependencies.map(dep => ({
      source: dep.sourceId,
      target: dep.targetId,
      type: dep.type
    }));
  }

  private updateGraph(): void {
    this.g.selectAll('*').remove();

    switch (this.currentLayout) {
      case 'force':
        this.renderForceLayout();
        break;
      case 'tree':
        this.renderTreeLayout();
        break;
      case 'radial':
        this.renderRadialLayout();
        break;
      default:
        this.renderForceLayout();
        break;
    }

    this.svg.on('click', (event: MouseEvent) => {
      if (event.target === this.svg.node()) {
        this.deselectNode();
      }
    });
  }

  private renderForceLayout(): void {
    // Create links
    const links = this.g.selectAll('.link')
      .data(this.links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow)');

    // Create nodes
    const nodes = this.g.selectAll('.node')
      .data(this.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .on('mouseover', (event: any, d: GraphNode) => {
        this.tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);

        let tooltipContent = `
          <strong>${d.name}</strong><br/>
          Path: ${d.filePath}<br/>
        `;

        // Add any metadata if available
        if (d.metadata) {
          Object.entries(d.metadata).forEach(([key, value]) => {
            tooltipContent += `${key}: ${value}<br/>`;
          });
        }

        this.tooltip.html(tooltipContent)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        this.tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      })
      .on('click', (event: any, d: GraphNode) => {
        event.stopPropagation();
        this.selectNode(d);
      })
      .call(this.dragBehavior());

    // Add circles to node groups
    nodes.append('circle')
      .attr('r', (d: GraphNode) => d.radius)
      .attr('fill', (d: GraphNode) => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Add text labels to node groups
    nodes.append('text')
      .attr('dx', 15)
      .attr('dy', 4)
      .text((d: GraphNode) => d.name)
      .attr('fill', '#333');

    // Set up force simulation
    this.simulation = d3.forceSimulation<GraphNode>(this.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>()
        .id((d: GraphNode) => d.id)
        .links(this.links)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collide', d3.forceCollide().radius(40))
      .on('tick', () => {
        links
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        nodes
          .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });

    // If there's a selected node, highlight it
    if (this.selectedNode) {
      this.highlightSelected();
    }
  }

  private renderTreeLayout(): void {
    // Create hierarchical data structure
    const stratify = d3.stratify<any>()
      .id((d: any) => d.id)
      .parentId((d: any) => {
        // Find links that target this node
        const parentLinks = this.links.filter(link => {
          const targetId = typeof link.target === 'string' ? link.target : link.target.id;
          return targetId === d.id;
        });

        // Return the first parent if found
        if (parentLinks.length > 0) {
          const sourceId = typeof parentLinks[0].source === 'string' ?
            parentLinks[0].source : parentLinks[0].source.id;
          return sourceId;
        }

        // No parent found
        return null;
      });

    // Find root nodes (nodes with no parents)
    const rootNodes = this.findRootNodes();

    if (rootNodes.length === 0) return;

    // Create a virtual root to handle multiple roots
    const virtualRoot = { id: 'virtual-root', name: 'root', filePath: '', radius: 0, color: 'none' };
    const dataWithRoot = [virtualRoot, ...this.nodes];

    // Connect virtual root to all real roots
    rootNodes.forEach(rootNode => {
      this.links.push({ source: virtualRoot.id, target: rootNode.id, type: 'virtual' });
    });

    // Create hierarchical structure
    let root: d3.HierarchyNode<any>;
    try {
      root = stratify(dataWithRoot);
    } catch (e) {
      console.error('Failed to create hierarchy:', e);
      // Fall back to force layout
      this.renderForceLayout();
      return;
    }

    // Create tree layout
    const treeLayout = d3.tree<any>()
      .size([this.width - 100, this.height - 100]);

    // Apply the layout
    treeLayout(root);

    // Draw links
    this.g.selectAll('.link')
      .data(root.links().filter(link => link.source.data.id !== 'virtual-root'))
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal<any, any>()
        .x((d: any) => d.y + 50)
        .y((d: any) => d.x + this.height / 2 - root.height * 40))
      .attr('fill', 'none')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow)');

    // Draw nodes
    const nodes = this.g.selectAll('.node')
      .data(root.descendants().filter(d => d.data.id !== 'virtual-root'))
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) =>
        `translate(${d.y + 50},${d.x + this.height / 2 - root.height * 40})`)
      .on('mouseover', (event: any, d: any) => {
        const nodeData = d.data;
        this.tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);

        let tooltipContent = `
          <strong>${nodeData.name}</strong><br/>
          Path: ${nodeData.filePath}<br/>
        `;

        // Add any metadata if available
        if (nodeData.metadata) {
          Object.entries(nodeData.metadata).forEach(([key, value]) => {
            tooltipContent += `${key}: ${value}<br/>`;
          });
        }

        this.tooltip.html(tooltipContent)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        this.tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      })
      .on('click', (event: any, d: any) => {
        event.stopPropagation();
        this.selectNode(d.data);
      });

    // Add circles to node groups
    nodes.append('circle')
      .attr('r', (d: any) => d.data.radius)
      .attr('fill', (d: any) => d.data.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Add text labels to node groups
    nodes.append('text')
      .attr('dx', 15)
      .attr('dy', 4)
      .text((d: any) => d.data.name)
      .attr('fill', '#333');

    // If there's a selected node, highlight it
    if (this.selectedNode) {
      this.highlightSelected();
    }
  }

  private renderRadialLayout(): void {
    // Create hierarchical data structure similar to tree layout
    const stratify = d3.stratify<any>()
      .id((d: any) => d.id)
      .parentId((d: any) => {
        const parentLinks = this.links.filter(link => {
          const targetId = typeof link.target === 'string' ? link.target : link.target.id;
          return targetId === d.id;
        });

        if (parentLinks.length > 0) {
          const sourceId = typeof parentLinks[0].source === 'string' ?
            parentLinks[0].source : parentLinks[0].source.id;
          return sourceId;
        }

        return null;
      });

    const rootNodes = this.findRootNodes();

    if (rootNodes.length === 0) return;

    const virtualRoot = { id: 'virtual-root', name: 'root', filePath: '', radius: 0, color: 'none' };
    const dataWithRoot = [virtualRoot, ...this.nodes];

    rootNodes.forEach(rootNode => {
      this.links.push({ source: virtualRoot.id, target: rootNode.id, type: 'virtual' });
    });

    let root: d3.HierarchyNode<any>;
    try {
      root = stratify(dataWithRoot);
    } catch (e) {
      console.error('Failed to create hierarchy:', e);
      this.renderForceLayout();
      return;
    }

    // Create radial layout
    const radius = Math.min(this.width, this.height) / 2 - 80;
    const radialLayout = d3.cluster<any>()
      .size([360, radius]);

    // Apply the layout
    radialLayout(root);

    // Translate to center
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // Draw links
    this.g.selectAll('.link')
      .data(root.links().filter(link => link.source.data.id !== 'virtual-root'))
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', (d: any) => {
        const sourceX = centerX + d.source.y * Math.cos((d.source.x - 90) * Math.PI / 180);
        const sourceY = centerY + d.source.y * Math.sin((d.source.x - 90) * Math.PI / 180);
        const targetX = centerX + d.target.y * Math.cos((d.target.x - 90) * Math.PI / 180);
        const targetY = centerY + d.target.y * Math.sin((d.target.x - 90) * Math.PI / 180);

        return `M${sourceX},${sourceY}L${targetX},${targetY}`;
      })
      .attr('fill', 'none')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow)');

    // Draw nodes
    const nodes = this.g.selectAll('.node')
      .data(root.descendants().filter(d => d.data.id !== 'virtual-root'))
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => {
        const x = centerX + d.y * Math.cos((d.x - 90) * Math.PI / 180);
        const y = centerY + d.y * Math.sin((d.x - 90) * Math.PI / 180);
        return `translate(${x},${y})`;
      })
      .on('mouseover', (event: any, d: any) => {
        const nodeData = d.data;
        this.tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);

        let tooltipContent = `
          <strong>${nodeData.name}</strong><br/>
          Path: ${nodeData.filePath}<br/>
        `;

        if (nodeData.metadata) {
          Object.entries(nodeData.metadata).forEach(([key, value]) => {
            tooltipContent += `${key}: ${value}<br/>`;
          });
        }

        this.tooltip.html(tooltipContent)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        this.tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      })
      .on('click', (event: any, d: any) => {
        event.stopPropagation();
        this.selectNode(d.data);
      });

    // Add circles to node groups
    nodes.append('circle')
      .attr('r', (d: any) => d.data.radius)
      .attr('fill', (d: any) => d.data.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Add text labels to node groups
    nodes.append('text')
      .attr('dx', 15)
      .attr('dy', 4)
      .text((d: any) => d.data.name)
      .attr('fill', '#333');

    // If there's a selected node, highlight it
    if (this.selectedNode) {
      this.highlightSelected();
    }
  }

  private findRootNodes(): GraphNode[] {
    // Find nodes that are sources but not targets
    const targetIds = new Set(this.links.map(link =>
      typeof link.target === 'string' ? link.target : link.target.id
    ));

    return this.nodes.filter(node => !targetIds.has(node.id));
  }

  private dragBehavior(): any {
    return d3.drag<any, GraphNode>()
      .on('start', (event: any, d: any) => {
        if (!event.active && this.simulation) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event: any, d: any) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event: any, d: any) => {
        if (!event.active && this.simulation) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  }

  private selectNode(node: GraphNode): void {
    this.selectedNode = node;

    // Find the corresponding component in the original data
    const component = this.graphData?.components.find(comp => comp.itemId === node.id);

    if (component) {
      // Emit the selected component to the parent
      this.nodeSelected.emit(component);
    }

    this.highlightSelected();
  }

  private deselectNode(): void {
    this.selectedNode = null;
    // Emit null to indicate no selection
    this.nodeSelected.emit(null as any);
    this.highlightSelected();
  }

  private highlightSelected(): void {
    if (!this.svg || !this.selectedNode) {
      // Reset highlighting if no selection
      this.g.selectAll('.node circle')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);

      this.g.selectAll('.link')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 2);

      return;
    }

    // Reset all nodes and links
    this.g.selectAll('.node circle')
      .attr('r', (d: any) => d.radius || d.data?.radius || 10)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    this.g.selectAll('.link')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    // Find the selected node
    const selectedNodeId = this.selectedNode.id;

    // Find direct connections
    const connectedTargets = new Set<string>();
    const connectedSources = new Set<string>();

    this.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;

      if (sourceId === selectedNodeId) {
        connectedTargets.add(targetId);
      }

      if (targetId === selectedNodeId) {
        connectedSources.add(sourceId);
      }
    });

    // Highlight the selected node
    this.g.selectAll('.node')
      .filter((d: any) => {
        const nodeId = d.id || d.data?.id;
        return nodeId === selectedNodeId;
      })
      .select('circle')
      .attr('r', (d: any) => (d.radius || d.data?.radius || 10) * 1.5)
      .attr('stroke', '#ff6600')
      .attr('stroke-width', 3);

    // Highlight nodes connected to the selected node
    this.g.selectAll('.node')
      .filter((d: any) => {
        const nodeId = d.id || d.data?.id;
        return connectedTargets.has(nodeId) || connectedSources.has(nodeId);
      })
      .select('circle')
      .attr('r', (d: any) => (d.radius || d.data?.radius || 10) * 1.2)
      .attr('stroke', '#66aaff')
      .attr('stroke-width', 2);

    // Highlight links connected to the selected node
    this.g.selectAll('.link')
      .filter((d: any) => {
        const sourceId = typeof d.source === 'string' ? d.source :
          (d.source.id || d.source.data?.id);
        const targetId = typeof d.target === 'string' ? d.target :
          (d.target.id || d.target.data?.id);

        return (sourceId === selectedNodeId || targetId === selectedNodeId) &&
          (d.source.data?.id !== 'virtual-root' && d.target.data?.id !== 'virtual-root');
      })
      .attr('stroke', '#66aaff')
      .attr('stroke-opacity', 1)
      .attr('stroke-width', 3);
  }

  private resizeGraph(): void {
    if (!this.svg) return;

    this.width = this.graphContainer.nativeElement.offsetWidth;
    this.height = this.graphContainer.nativeElement.offsetHeight || 600;

    this.svg
      .attr('width', '100%')
      .attr('height', this.height)
      .attr('viewBox', [0, 0, this.width, this.height]);

    if (this.simulation) {
      this.simulation
        .force('center', d3.forceCenter(this.width / 2, this.height / 2))
        .restart();
    } else {
      this.updateGraph();
    }
  }

  // Public methods for external control
  zoomIn(): void {
    this.svg.transition().call(this.zoom.scaleBy, 1.2);
  }

  zoomOut(): void {
    this.svg.transition().call(this.zoom.scaleBy, 0.8);
  }

  resetZoom(): void {
    this.svg.transition().call(this.zoom.transform, d3.zoomIdentity);
  }

  centerGraph(): void {
    this.svg.transition()
      .call(this.zoom.transform, d3.zoomIdentity
        .translate(this.width / 2, this.height / 2)
        .scale(1));
  }

  // Switch between different layout types
  setLayout(layoutType: 'force' | 'tree' | 'radial'): void {
    this.currentLayout = layoutType;
    this.updateGraph();
  }

  // Allow searching/focusing on a specific component
  focusComponent(componentId: string): void {
    const node = this.nodes.find(n => n.id === componentId);
    if (node) {
      this.selectNode(node);

      // Wait for force layout to stabilize
      setTimeout(() => {
        // Calculate position for zoom
        let x, y;

        if (this.currentLayout === 'force' && node.x && node.y) {
          x = node.x;
          y = node.y;
        } else {
          // For tree and radial layouts, get position from the DOM
          const selection = this.g.selectAll('.node')
            .filter((d: any) => {
              const nodeId = d.id || d.data?.id;
              return nodeId === componentId;
            });

          if (!selection.empty()) {
            const transform = d3.select(selection.node()).attr('transform');
            const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
            if (match) {
              x = parseFloat(match[1]);
              y = parseFloat(match[2]);
            }
          }
        }

        if (x !== undefined && y !== undefined) {
          const scale = 1.5;
          this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, d3.zoomIdentity
              .translate(this.width / 2 - x * scale, this.height / 2 - y * scale)
              .scale(scale));
        }
      }, 100);
    }
  }
}
