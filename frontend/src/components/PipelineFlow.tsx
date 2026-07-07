import { useCallback, useMemo } from 'react'
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
import { motion } from 'motion/react'

export type NodeStatus = 'pending' | 'active' | 'done' | 'skipped'

export interface PipelineNodeData {
  label: string
  model?: string
  detail?: string
  status: NodeStatus
  latencyMs?: number
  conditional?: boolean
  hardware?: string
  [key: string]: unknown
}

const STATUS_COLORS: Record<NodeStatus, { border: string; bg: string; text: string }> = {
  pending: { border: '#444', bg: '#1a1a2e', text: '#666' },
  active: { border: '#00aeef', bg: '#0a1628', text: '#00aeef' },
  done: { border: '#3e8635', bg: '#0d1f0d', text: '#3e8635' },
  skipped: { border: '#666', bg: '#1a1a2e', text: '#666' },
}

function PipelineNode({ data }: NodeProps<Node<PipelineNodeData>>) {
  const colors = STATUS_COLORS[data.status]
  return (
    <>
      <Handle type="target" position={Position.Left} style={{ background: colors.border, border: 'none', width: 8, height: 8 }} />
      <motion.div
        style={{
          minWidth: 160,
          padding: '14px 18px',
          borderRadius: 12,
          border: `2px solid ${colors.border}`,
          background: colors.bg,
          textAlign: 'center',
          position: 'relative',
        }}
        animate={{
          borderColor: colors.border,
          scale: data.status === 'active' ? [1, 1.04, 1] : 1,
          boxShadow: data.status === 'active' ? '0 0 24px rgba(0, 174, 239, 0.3)' : '0 0 0 transparent',
        }}
        transition={{
          scale: { repeat: data.status === 'active' ? Infinity : 0, duration: 0.8 },
        }}
      >
        {data.conditional && (
          <div style={{
            position: 'absolute', top: -10, right: -10,
            padding: '2px 8px', borderRadius: 4, fontSize: 9,
            background: '#2a1a00', color: '#f0ab00', border: '1px solid #f0ab00', fontWeight: 700,
          }}>
            CONDITIONAL
          </div>
        )}

        <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{data.label}</div>

        {data.model && (
          <div style={{ fontSize: 10, color: '#888', marginTop: 3, fontFamily: 'Red Hat Mono, monospace' }}>
            {data.model}
          </div>
        )}

        {data.hardware && (
          <span style={{
            display: 'inline-block', marginTop: 4, padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700,
            background: data.hardware === 'gpu' ? '#2a1a00' : '#0a1628',
            color: data.hardware === 'gpu' ? '#f0ab00' : '#00aeef',
            border: `1px solid ${data.hardware === 'gpu' ? '#f0ab00' : '#00aeef'}`,
          }}>
            {data.hardware.toUpperCase()}
          </span>
        )}

        {data.status === 'active' && (
          <motion.div
            style={{ marginTop: 6, fontSize: 11, color: '#00aeef' }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            processing...
          </motion.div>
        )}

        {data.status === 'done' && data.latencyMs !== undefined && (
          <motion.div
            style={{ marginTop: 6, fontSize: 18, fontWeight: 700, color: '#3e8635', fontFamily: 'Red Hat Mono, monospace' }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {data.latencyMs}ms
          </motion.div>
        )}

        {data.detail && (
          <div style={{ fontSize: 10, color: '#888', marginTop: 3, fontStyle: 'italic' }}>{data.detail}</div>
        )}

        {data.status === 'skipped' && (
          <motion.div style={{ marginTop: 4, fontSize: 10, color: '#666' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            skipped
          </motion.div>
        )}
      </motion.div>
      <Handle type="source" position={Position.Right} style={{ background: colors.border, border: 'none', width: 8, height: 8 }} />
    </>
  )
}

const nodeTypes = { pipeline: PipelineNode }

interface PipelineFlowProps {
  nodes: Array<{
    id: string
    label: string
    model?: string
    detail?: string
    status: NodeStatus
    latencyMs?: number
    conditional?: boolean
    hardware?: string
  }>
}

export function PipelineFlow({ nodes: pipelineNodes }: PipelineFlowProps) {
  const flowNodes: Node<PipelineNodeData>[] = useMemo(() =>
    pipelineNodes.map((n, i) => ({
      id: n.id,
      type: 'pipeline',
      position: { x: i * 220, y: 0 },
      data: {
        label: n.label,
        model: n.model,
        detail: n.detail,
        status: n.status,
        latencyMs: n.latencyMs,
        conditional: n.conditional,
        hardware: n.hardware,
      },
    })),
    [pipelineNodes]
  )

  const flowEdges: Edge[] = useMemo(() =>
    pipelineNodes.slice(0, -1).map((n, i) => {
      const next = pipelineNodes[i + 1]
      const isDone = n.status === 'done'
      const isSkipped = next?.status === 'skipped'
      return {
        id: `${n.id}-${next.id}`,
        source: n.id,
        target: next.id,
        animated: n.status === 'active',
        style: {
          stroke: isSkipped ? '#666' : isDone ? '#3e8635' : '#333',
          strokeWidth: 2,
          strokeDasharray: isSkipped ? '6 4' : undefined,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: isDone ? '#3e8635' : '#444' },
      }
    }),
    [pipelineNodes]
  )

  const onNodesChange = useCallback(() => {}, [])

  return (
    <div style={{ width: '100%', height: 140, borderRadius: 12, overflow: 'hidden', background: '#0d0d1a' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#222" gap={20} />
      </ReactFlow>
    </div>
  )
}
