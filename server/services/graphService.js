
// Graph Service - Ring Detection and Network Visualization
// Based on PAYMENTS_AI_SYSTEM_DESIGN.md Section 11

import EventEmitter from 'events';

class GraphService extends EventEmitter {
    constructor() {
        super();
        this.nodes = new Map(); // id -> { id, type, risk, metadata }
        this.edges = []; // { source, target, weight, type, transactions }
        this.rings = []; // Array of ring objects

        // Add central Security AI Node
        this.addNode('SECURITY_AI', 'security', { label: 'Security AI' });
    }

    // Add or update a node
    addNode(id, type, metadata = {}) {
        if (!this.nodes.has(id)) {
            const node = {
                id,
                type,
                risk: 0,
                metadata,
                connections: 0,
                firstSeen: Date.now()
            };
            this.nodes.set(id, node);
            return node;
        } else {
            const node = this.nodes.get(id);
            node.metadata = { ...node.metadata, ...metadata };
            return node;
        }
    }

    // Add an edge between nodes
    addEdge(source, target, type, weight = 1, txData = null) {
        if (!this.nodes.has(source) || !this.nodes.has(target)) return;

        // Check if edge already exists
        let edge = this.edges.find(e =>
            (e.source === source && e.target === target) ||
            (e.source === target && e.target === source)
        );

        if (edge) {
            edge.weight += weight;
            if (txData) {
                if (!edge.transactions) edge.transactions = [];
                edge.transactions.push(txData);
            }
        } else {
            const newEdge = {
                source,
                target,
                type,
                weight,
                transactions: txData ? [txData] : []
            };
            this.edges.push(newEdge);
            return newEdge;
        }
    }

    // Process a transaction to build the graph
    processTransaction(tx) {
        if (!tx) return;

        const { trader_id, symbol, device_id, ip, total_value, type, risk, timestamp, isFraud } = tx;
        const riskScore = risk?.score || (isFraud ? 0.9 : 0);

        // 1. Add Trader Node
        const traderNode = this.addNode(trader_id, 'account', {
            name: tx.trader_name,
            lastTx: timestamp
        });

        // Update risk
        if (riskScore > traderNode.risk) {
            traderNode.risk = riskScore;
        }

        // 2. Link to Security AI if high risk
        if (riskScore > 0.7) {
            this.addEdge('SECURITY_AI', trader_id, 'flagged', 5, {
                reason: 'High Risk Activity',
                score: riskScore
            });
        }

        // 3. Add Device Node & Link
        if (device_id) {
            this.addNode(device_id, 'device', { lastSeen: timestamp });
            this.addEdge(trader_id, device_id, 'uses_device', 1);

            // Link high risk device to Security AI
            if (isFraud || riskScore > 0.8) {
                this.addEdge('SECURITY_AI', device_id, 'flagged_device', 5);
            }
        }

        // 4. Add IP Node & Link
        if (ip) {
            const ipId = `IP:${ip}`;
            this.addNode(ipId, 'ip', { lastSeen: timestamp });
            this.addEdge(trader_id, ipId, 'from_ip', 1);
        }

        // 5. Add Stock/Asset Node (optional, can clutter graph)
        // Only add if it's a significant trade to avoid noise
        if (total_value > 50000) {
            this.addNode(symbol, 'asset', { type: 'stock' });
            this.addEdge(trader_id, symbol, 'trades', 1, { amount: total_value, type });
        }
    }

    // Detect rings (Simplified for visualization)
    detectRings() {
        return this.rings;
    }

    // Get graph data for visualization
    getGraph(minRisk = 0) {
        // Return all nodes to show full network, but color by risk
        const nodes = Array.from(this.nodes.values()).map(n => ({
            id: n.id,
            type: n.type,
            risk: n.risk,
            activity: n.connections
        }));

        const links = this.edges.map(e => ({
            source: e.source,
            target: e.target,
            type: e.type,
            weight: e.weight
        }));

        return { nodes, links };
    }

    // Set rings from simulator
    setRings(ringsData) {
        this.rings = ringsData;
    }

    // Get stats
    getStats() {
        let highRiskCount = 0;
        let mediumRiskCount = 0;
        let lowRiskCount = 0;
        let totalAmount = 0;
        let blockedAmount = 0;

        this.nodes.forEach(node => {
            if (node.type === 'account') {
                if (node.risk > 0.8) highRiskCount++;
                else if (node.risk > 0.4) mediumRiskCount++;
                else lowRiskCount++;
            }
        });

        this.edges.forEach(edge => {
            if (edge.transactions) {
                edge.transactions.forEach(tx => {
                    if (tx) {
                        totalAmount += tx.amount || 0;
                        if (tx.risk > 0.8) blockedAmount += tx.amount || 0;
                    }
                });
            }
        });

        return {
            totalNodes: this.nodes.size,
            totalEdges: this.edges.length,
            activeRings: this.rings.length,
            riskDistribution: { high: highRiskCount, medium: mediumRiskCount, low: lowRiskCount },
            totalVolume: totalAmount,
            blockedVolume: blockedAmount,
            autoApprovalRate: totalAmount > 0 ? ((totalAmount - blockedAmount) / totalAmount) * 100 : 95
        };
    }

    // Clear old data (optional for demo)
    prune(maxAgeMs = 3600000) {
        const now = Date.now();
        this.nodes.forEach((node, id) => {
            if (now - node.firstSeen > maxAgeMs && node.type === 'destination') {
                this.nodes.delete(id);
            }
        });
    }
}

export const graphService = new GraphService();
