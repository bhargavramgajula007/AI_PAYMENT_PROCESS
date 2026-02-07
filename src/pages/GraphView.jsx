import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { RefreshCw, AlertTriangle, Users, Share2, Lock, Eye, Shield, Activity } from 'lucide-react';

const GraphView = () => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const simulationRef = useRef(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [rings, setRings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch graph data from API
    const fetchGraphData = useCallback(async () => {
        try {
            setLoading(true);
            const [graphRes, ringsRes] = await Promise.all([
                fetch('http://localhost:3000/api/graph?minRisk=0'),
                fetch('http://localhost:3000/api/rings')
            ]);
            const graph = await graphRes.json();
            const ringsData = await ringsRes.json();

            // Process nodes and links
            const nodes = (graph.nodes || []).map(n => ({
                id: n.id,
                type: n.type || 'account',
                risk: n.risk || 0,
                connections: n.activity || 0
            }));

            const links = (graph.links || graph.edges || []).map(e => ({
                source: e.source,
                target: e.target,
                type: e.type || 'connection',
                weight: e.weight || 1
            }));

            // Only update if we have data
            if (nodes.length > 0) {
                setGraphData({ nodes, links });
            }
            setRings(Array.isArray(ringsData) ? ringsData : []);
            setLoading(false);
        } catch (e) {
            console.error('Failed to fetch graph data:', e);
            setLoading(false);
        }
    }, []);

    // Initial fetch and polling
    useEffect(() => {
        fetchGraphData();
        const interval = setInterval(fetchGraphData, 8000);
        return () => clearInterval(interval);
    }, [fetchGraphData]);

    // D3 Force Simulation - runs once and updates
    useEffect(() => {
        if (!graphData.nodes.length || !svgRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth || 800;
        const height = container.clientHeight || 600;

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        // Clear previous content
        svg.selectAll('*').remove();

        // Create main group for zoom
        const g = svg.append('g');

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.2, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
        svg.call(zoom);

        // Create arrow marker for directed edges
        svg.append('defs').append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 20)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .append('path')
            .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
            .attr('fill', '#64748b');

        // Create simulation
        const simulation = d3.forceSimulation(graphData.nodes)
            .force('link', d3.forceLink(graphData.links)
                .id(d => d.id)
                .distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(40));

        simulationRef.current = simulation;

        // Draw links
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(graphData.links)
            .join('line')
            .attr('stroke', d => {
                if (d.type === 'flagged') return '#ef4444';
                if (d.type === 'uses_device') return '#8b5cf6';
                return '#475569';
            })
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', d => Math.max(1, Math.min(4, d.weight)));

        // Draw nodes
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(graphData.nodes)
            .join('g')
            .style('cursor', 'pointer')
            .call(d3.drag()
                .on('start', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on('drag', (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on('end', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }));

        // Node circles with different sizes/colors
        node.append('circle')
            .attr('r', d => {
                if (d.type === 'security') return 20;
                if (d.type === 'account') return 14;
                if (d.type === 'device') return 10;
                return 8;
            })
            .attr('fill', d => {
                if (d.type === 'security') return '#3b82f6';
                if (d.risk > 0.8) return '#dc2626';
                if (d.risk > 0.5) return '#f59e0b';
                if (d.type === 'device') return '#8b5cf6';
                if (d.type === 'ip') return '#06b6d4';
                return '#334155';
            })
            .attr('stroke', d => {
                if (d.type === 'security') return '#60a5fa';
                if (d.risk > 0.8) return '#fca5a5';
                return '#64748b';
            })
            .attr('stroke-width', 2);

        // Node labels
        node.append('text')
            .text(d => {
                if (d.type === 'security') return '🛡️';
                if (d.id.length > 8) return d.id.substring(0, 8) + '...';
                return d.id;
            })
            .attr('dy', d => d.type === 'security' ? 5 : -18)
            .attr('text-anchor', 'middle')
            .attr('fill', '#e2e8f0')
            .attr('font-size', d => d.type === 'security' ? '16px' : '10px')
            .attr('font-family', 'monospace');

        // Click handler for node selection
        node.on('click', (event, d) => {
            event.stopPropagation();
            setSelectedNode(d);
        });

        // Click on background to deselect
        svg.on('click', () => setSelectedNode(null));

        // Update positions on each tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        // Cleanup
        return () => {
            simulation.stop();
        };
    }, [graphData]);

    const getNodeTypeIcon = (type) => {
        switch (type) {
            case 'account': return <Users className="w-4 h-4" />;
            case 'device': return <Share2 className="w-4 h-4" />;
            case 'ip': return <Activity className="w-4 h-4" />;
            case 'security': return <Shield className="w-4 h-4 text-blue-400" />;
            default: return <Share2 className="w-4 h-4" />;
        }
    };

    return (
        <div className="flex gap-6 h-[calc(100vh-140px)]">
            {/* Main Graph Area */}
            <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm relative overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-lg font-medium flex items-center gap-2">
                        <Share2 className="w-5 h-5" /> Network Graph
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="text-xs text-slate-500">
                            {graphData.nodes.length} nodes • {graphData.links.length} links
                        </div>
                        <button
                            onClick={fetchGraphData}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div ref={containerRef} className="flex-1 bg-slate-950/50">
                    {graphData.nodes.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            <div className="text-center">
                                <Share2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p>Waiting for network data...</p>
                                <p className="text-xs mt-2">Nodes will appear as transactions are processed</p>
                            </div>
                        </div>
                    ) : (
                        <svg ref={svgRef} className="w-full h-full" />
                    )}
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-black/70 border border-white/10 backdrop-blur">
                    <div className="text-xs text-slate-400 mb-2">Legend</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                            <span>Security AI</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-600"></span>
                            <span>High Risk</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                            <span>Medium Risk</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-slate-600"></span>
                            <span>Account</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-violet-500"></span>
                            <span>Device</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
                            <span>IP</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 space-y-4">
                {/* Node Details */}
                <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
                        Node Details
                    </h3>
                    {selectedNode ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                    {getNodeTypeIcon(selectedNode.type)}
                                    <span className="uppercase">{selectedNode.type}</span>
                                </div>
                                <div className="font-mono text-lg break-all">{selectedNode.id}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-xs text-slate-500 mb-1">Risk Score</div>
                                <div className="flex items-center gap-3">
                                    <div className={`text-3xl font-light ${selectedNode.risk > 0.8 ? 'text-red-400' : selectedNode.risk > 0.5 ? 'text-amber-400' : 'text-white'}`}>
                                        {(selectedNode.risk * 100).toFixed(0)}%
                                    </div>
                                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${selectedNode.risk > 0.8 ? 'bg-red-500' : selectedNode.risk > 0.5 ? 'bg-amber-500' : 'bg-green-500'}`}
                                            style={{ width: `${selectedNode.risk * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                                    <Lock className="w-4 h-4" /> Freeze
                                </button>
                                <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                                    <Eye className="w-4 h-4" /> Investigate
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm">Click a node to view details.</p>
                    )}
                </div>

                {/* Detected Rings */}
                <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Detected Rings ({rings?.length || 0})
                    </h3>
                    {!rings || rings.length === 0 ? (
                        <p className="text-slate-500 text-sm">No fraud rings detected yet.</p>
                    ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {rings.map((ring, idx) => (
                                <div
                                    key={ring.ring_id || idx}
                                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-mono text-xs text-red-400">{ring.ring_id || `Ring ${idx + 1}`}</span>
                                        <span className="text-xs text-red-300">{((ring.avg_risk || 0) * 100).toFixed(0)}% risk</span>
                                    </div>
                                    <div className="text-sm text-white mb-1">
                                        {ring.member_count || ring.members?.length || 0} linked accounts
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        Type: {ring.fraud_type || 'UNKNOWN'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GraphView;
