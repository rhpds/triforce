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

interface RoutingNodeData {
  label: string
  type: 'input' | 'router' | 'model' | 'output'
  tier?: 'cpu' | 'gpu'
  active?: boolean
  latencyMs?: number
  confidence?: number
  [key: string]: unknown
}

const TIER_STYLES = {
  input: { bg: '#1a1a2e', border: '#555', icon: '📥' },
  router: { bg: '#0a1628', border: '#00aeef', icon: '🔀' },
  cpu: { bg: '#0d1f0d', border: '#3e8635', icon: '🖥️' },
  gpu: { bg: '#2a1a00', border: '#f0ab00', icon: '⚡' },
  output: { bg: '#1a1a2e', border: '#555', icon: '📤' },
}

function RoutingNode({ data }: NodeProps<Node<RoutingNodeData>>) {
  const key = data.tier || data.type
  const style = TIER_STYLES[key as keyof typeof TIER_STYLES] || TIER_STYLES.input
  const isActive = data.active
  return (
    <>
      <Handle type="target" position={Position.Left} style={{ background: style.border, border: 'none', width: 6, height: 6 }} />
      <div style={{
        minWidth: 130, padding: '10px 14px', borderRadius: 10, textAlign: 'center',
        border: `2px solid ${isActive ? style.border : '#333'}`,
        background: isActive ? style.bg : '#111',
        opacity: isActive === false ? 0.4 : 1,
        transition: 'all 0.3s ease',
      }}>
        <div style={{ fontSize: 16, marginBottom: 2 }}>{style.icon}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? style.border : '#555' }}>{data.label}</div>
        {data.confidence !== undefined && (
          <div style={{ fontSize: 10, color: '#888', fontFamily: 'Red Hat Mono, monospace', marginTop: 2 }}>
            {(data.confidence * 100).toFixed(0)}% confidence
          </div>
        )}
        {data.latencyMs !== undefined && data.latencyMs > 0 && (
          <div style={{ fontSize: 14, fontWeight: 700, color: style.border, fontFamily: 'Red Hat Mono, monospace', marginTop: 4 }}>
            {data.latencyMs}ms
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: style.border, border: 'none', width: 6, height: 6 }} />
    </>
  )
}

const nodeTypes = { routing: RoutingNode }

interface RoutingFlowProps {
  routeResult?: { route: string; model: string; hardware: string; confidence: number; latency_ms: number }
  onRoute?: (text: string) => void
}

export function RoutingFlow({ routeResult }: RoutingFlowProps) {
  const activeRoute = routeResult?.route

  const flowNodes: Node<RoutingNodeData>[] = useMemo(() => [
    { id: 'input', type: 'routing', position: { x: 0, y: 80 }, data: { label: 'Request', type: 'input', active: true } },
    { id: 'router', type: 'routing', position: { x: 180, y: 80 }, data: { label: 'Semantic Router', type: 'router', active: true, latencyMs: routeResult?.latency_ms, confidence: routeResult?.confidence } },
    { id: 'cpu-simple', type: 'routing', position: { x: 380, y: 0 }, data: { label: 'granite-2b-cpu', type: 'model', tier: 'cpu', active: activeRoute === 'simple' } },
    { id: 'cpu-medium', type: 'routing', position: { x: 380, y: 80 }, data: { label: 'qwen25-3b-cpu', type: 'model', tier: 'cpu', active: activeRoute === 'medium' } },
    { id: 'gpu-complex', type: 'routing', position: { x: 380, y: 160 }, data: { label: routeResult?.model || 'granite-8b', type: 'model', tier: 'gpu', active: activeRoute === 'complex' } },
    { id: 'output', type: 'routing', position: { x: 560, y: 80 }, data: { label: 'Response', type: 'output', active: !!routeResult } },
  ], [routeResult, activeRoute])

  const flowEdges: Edge[] = useMemo(() => {
    const base: Edge[] = [
      { id: 'in-r', source: 'input', target: 'router', animated: true, style: { stroke: '#00aeef', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#00aeef' } },
    ]

    const routes = [
      { id: 'r-simple', target: 'cpu-simple', route: 'simple', color: '#3e8635' },
      { id: 'r-medium', target: 'cpu-medium', route: 'medium', color: '#3e8635' },
      { id: 'r-complex', target: 'gpu-complex', route: 'complex', color: '#f0ab00' },
    ]

    routes.forEach(r => {
      const isActive = activeRoute === r.route
      base.push({
        id: r.id,
        source: 'router',
        target: r.target,
        animated: isActive,
        style: { stroke: isActive ? r.color : '#333', strokeWidth: isActive ? 2 : 1, strokeDasharray: isActive ? undefined : '4 4' },
        markerEnd: { type: MarkerType.ArrowClosed, color: isActive ? r.color : '#333' },
      })
      base.push({
        id: `${r.id}-out`,
        source: r.target,
        target: 'output',
        animated: isActive,
        style: { stroke: isActive ? r.color : '#333', strokeWidth: isActive ? 2 : 1, strokeDasharray: isActive ? undefined : '4 4' },
        markerEnd: { type: MarkerType.ArrowClosed, color: isActive ? r.color : '#333' },
      })
    })

    return base
  }, [activeRoute])

  return (
    <div style={{ width: '100%', height: 240, borderRadius: 12, overflow: 'hidden', background: '#0d0d1a' }}>
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
        <Background color="#1a1a2e" gap={20} />
      </ReactFlow>
    </div>
  )
}
