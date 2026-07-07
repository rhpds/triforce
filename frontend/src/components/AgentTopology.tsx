import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  Position,
  MarkerType,
  Handle,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

interface AgentNodeData {
  label: string
  type: 'agent' | 'gateway' | 'router' | 'store'
  skills?: string[]
  protocol?: string
  status?: 'healthy' | 'degraded' | 'down'
  [key: string]: unknown
}

const TYPE_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  agent: { bg: '#0d1f0d', border: '#3e8635', icon: '🤖' },
  gateway: { bg: '#1a0d2e', border: '#7b2d8e', icon: '🔌' },
  router: { bg: '#0a1628', border: '#00aeef', icon: '🔀' },
  store: { bg: '#1a1a0d', border: '#f0ab00', icon: '💾' },
}

function AgentNode({ data }: NodeProps<Node<AgentNodeData>>) {
  const style = TYPE_STYLES[data.type] || TYPE_STYLES.agent
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: style.border, border: 'none', width: 6, height: 6 }} />
      <Handle type="target" position={Position.Left} id="left" style={{ background: style.border, border: 'none', width: 6, height: 6 }} />
      <div style={{
        minWidth: 140, padding: '12px 16px', borderRadius: 10,
        border: `2px solid ${style.border}`, background: style.bg, textAlign: 'center',
      }}>
        <div style={{ fontSize: 18, marginBottom: 4 }}>{style.icon}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: style.border }}>{data.label}</div>
        {data.protocol && (
          <div style={{ fontSize: 9, color: '#666', marginTop: 2, fontFamily: 'Red Hat Mono, monospace' }}>{data.protocol}</div>
        )}
        {data.skills && data.skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', marginTop: 6 }}>
            {data.skills.map(s => (
              <span key={s} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#222', color: '#aaa', border: '1px solid #333' }}>
                {s}
              </span>
            ))}
          </div>
        )}
        {data.status && (
          <div style={{
            marginTop: 4, fontSize: 9, fontWeight: 700,
            color: data.status === 'healthy' ? '#3e8635' : data.status === 'degraded' ? '#f0ab00' : '#cc0000',
          }}>
            ● {data.status.toUpperCase()}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: style.border, border: 'none', width: 6, height: 6 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ background: style.border, border: 'none', width: 6, height: 6 }} />
    </>
  )
}

const nodeTypes = { agent: AgentNode }

interface AgentTopologyProps {
  agents?: Array<{ name: string; skills: string[]; protocol: string; status?: string }>
}

export function AgentTopology({ agents }: AgentTopologyProps) {
  const defaultAgents = agents || [
    { name: 'Healthcare Agent', skills: ['classify', 'NER', 'summarize'], protocol: 'A2A + LangGraph' },
    { name: 'FinServ Agent', skills: ['fraud-score', 'compliance'], protocol: 'A2A + Quarkus' },
    { name: 'Orchestrator', skills: ['dispatch', 'monitor', 'workflow'], protocol: 'A2A client' },
  ]

  const flowNodes: Node<AgentNodeData>[] = useMemo(() => [
    { id: 'router', type: 'agent', position: { x: 250, y: 0 }, data: { label: 'Semantic Router', type: 'router', skills: ['classify', 'route'], protocol: '<1ms embedding' } },
    ...defaultAgents.map((a, i) => ({
      id: `agent-${i}`,
      type: 'agent' as const,
      position: { x: i * 220, y: 120 },
      data: { label: a.name, type: 'agent' as const, skills: a.skills, protocol: a.protocol, status: (a.status || 'healthy') as 'healthy' },
    })),
    { id: 'mcp', type: 'agent', position: { x: 500, y: 120 }, data: { label: 'MCP Gateway', type: 'gateway', skills: ['drug-interactions', 'FHIR', 'formulary'], protocol: 'JSON-RPC' } },
    { id: 'kafka', type: 'agent', position: { x: 0, y: 260 }, data: { label: 'AMQ Streams', type: 'store', skills: ['events', 'batch'], protocol: 'Kafka' } },
    { id: 'postgres', type: 'agent', position: { x: 250, y: 260 }, data: { label: 'PostgreSQL', type: 'store', skills: ['audit', 'inference-log'], protocol: 'pgvector' } },
  ], [defaultAgents])

  const flowEdges: Edge[] = useMemo(() => [
    { id: 'r-a0', source: 'router', target: 'agent-0', animated: true, style: { stroke: '#3e8635' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3e8635' } },
    { id: 'r-a1', source: 'router', target: 'agent-1', animated: true, style: { stroke: '#3e8635' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3e8635' } },
    { id: 'r-a2', source: 'router', target: 'agent-2', style: { stroke: '#00aeef' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#00aeef' } },
    { id: 'a0-mcp', source: 'agent-0', target: 'mcp', sourceHandle: 'right', targetHandle: 'left', style: { stroke: '#7b2d8e' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#7b2d8e' } },
    { id: 'a2-a0', source: 'agent-2', target: 'agent-0', sourceHandle: 'right', targetHandle: 'left', style: { stroke: '#00aeef', strokeDasharray: '6 3' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#00aeef' } },
    { id: 'a0-pg', source: 'agent-0', target: 'postgres', style: { stroke: '#f0ab00', strokeDasharray: '4 4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f0ab00' } },
    { id: 'a0-k', source: 'agent-0', target: 'kafka', style: { stroke: '#f0ab00', strokeDasharray: '4 4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f0ab00' } },
  ], [])

  return (
    <div style={{ width: '100%', height: 360, borderRadius: 12, overflow: 'hidden', background: '#0d0d1a' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1a1a2e" gap={24} />
      </ReactFlow>
    </div>
  )
}
