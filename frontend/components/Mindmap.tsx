"use client";
import React, { useState, useMemo } from 'react';
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

export default function Mindmap({ nodesData = [] }: { nodesData: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    // 1. Node Trung tâm (Gốc)
    initialNodes.push({
      id: 'root',
      data: { label: '🎯 Chủ đề chính' },
      position: { x: 0, y: 0 },
      style: { background: '#1e293b', color: '#fff', fontWeight: 'bold', borderRadius: '50%', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }
    });

    const radius = 200; // Khoảng cách từ tâm đến các thuật ngữ

    nodesData.forEach((item, i) => {
      const termId = `term-${i}`;
      const angle = (i / nodesData.length) * 2 * Math.PI;
      
      const posX = radius * Math.cos(angle);
      const posY = radius * Math.sin(angle);

      // 2. Node Thuật ngữ
      initialNodes.push({
        id: termId,
        data: { label: item.term, allData: item },
        position: { x: posX, y: posY },
        className: "cursor-pointer transition-all hover:scale-110",
        style: { background: '#3b82f6', color: '#fff', borderRadius: '12px', padding: '12px', width: 160, textAlign: 'center' }
      });

      // Nối từ gốc đến thuật ngữ
      initialEdges.push({
        id: `e-root-${termId}`,
        source: 'root',
        target: termId,
        animated: true,
        style: { stroke: '#94a3b8' }
      });

      // 3. Nếu node này đang được mở rộng (Click vào)
      if (expandedId === termId) {
        const detailId = `detail-${i}`;
        const distance = Math.sqrt(posX * posX + posY * posY);
        // Tính toán vector đơn vị (Unit Vector) để biết hướng đẩy
        const unitX = posX / distance;
        const unitY = posY / distance;
        // Tọa độ mới = Tọa độ cũ + (Hướng * Khoảng cách đẩy)
        const offset = 200;
        const detailX = posX + (unitX * offset);
        const detailY = posY + (unitY * offset);
        // Đặt node giải thích ở xa hơn một chút theo cùng hướng vector
        initialNodes.push({
          id: detailId,
          data: { label: `💡 ${item.metaphor}\n\n📝 ${item.example}` },
          position: { x: detailX, y: detailY },
          style: { 
            background: '#fff7ed', 
            color: '#7c2d12', 
            border: '2px solid #fdba74', 
            borderRadius: '12px', 
            padding: '12px', 
            width: 220, // Thu nhỏ chiều rộng để tránh đè node bên cạnh
            fontSize: '11px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 100 // Đảm bảo luôn nằm trên
            }
        });

        initialEdges.push({
          id: `e-${termId}-${detailId}`,
          source: termId,
          target: detailId,
          style: { stroke: '#fbbf24', strokeWidth: 2 }
        });
      }
    });

    return { nodes: initialNodes, edges: initialEdges };
  }, [nodesData, expandedId]);

  const onNodeClick = (_: any, node: Node) => {
    if (node.id.startsWith('term-')) {
      setExpandedId(expandedId === node.id ? null : node.id);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        onNodeClick={onNodeClick}
        fitView
      >
        <Background color="#cbd5e1" gap={25} />
        <Controls />
      </ReactFlow>
    </div>
  );
}