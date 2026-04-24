"use client";
import React, { useRef, useEffect } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

const transformer = new Transformer();

export default function Mindmap({ nodesData }: { nodesData: any }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const mmRef = useRef<Markmap | null>(null);

  // Hàm chuyển đổi dữ liệu JSON lồng nhau sang Markdown
  const jsonToMarkdown = (node: any, level: number = 0): string => {
    if (!node) return "";
    const indent = "  ".repeat(level);
    // Thay vì dùng gạch đầu dòng, Markmap hoạt động tốt nhất với cấu trúc này
    let md = `${indent}- ${node.name}\n`;
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        md += jsonToMarkdown(child, level + 1);
      });
    }
    return md;
  };

  useEffect(() => {
    if (!svgRef.current || !nodesData) return;

    try {
      // 1. Chuyển JSON thành Markdown
      const markdown = jsonToMarkdown(nodesData);
      
      // 2. Transform Markdown sang định dạng của Markmap
      const { root } = transformer.transform(markdown);

      // 3. Khởi tạo Markmap nếu chưa có
      if (!mmRef.current) {
        mmRef.current = Markmap.create(svgRef.current);
      }
      
      // 4. Đưa dữ liệu vào và "ép" nó hiển thị
      mmRef.current.setData(root);
      
      // FIX LỖI Ở ĐÂY: Khai báo const rõ ràng hoặc chỉ cần gọi .fit()
      // Nếu bạn muốn lấy tọa độ để xử lý riêng thì dùng dòng dưới:
      // const { minX, maxX, minY, maxY } = mmRef.current.state; 
      
      // Cách đơn giản nhất để nó tự căn chỉnh:
      setTimeout(() => {
        mmRef.current?.fit();
      }, 100); // Delay nhẹ để SVG kịp render
      
    } catch (error) {
      console.error("Lỗi vẽ Mindmap:", error);
    }
  }, [nodesData]);

  return (
    <div className="w-full h-full min-h-125 bg-white rounded-3xl relative overflow-hidden border border-gray-100 shadow-inner">
      {/* Thanh công cụ nhỏ để người dùng tương tác */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button 
          onClick={() => mmRef.current?.fit()}
          className="p-2 bg-white/80 backdrop-blur shadow-sm border border-blue-100 text-blue-600 rounded-xl hover:bg-blue-50 transition-all text-xs font-bold"
          title="Căn giữa sơ đồ"
        >
          🔍 Căn giữa
        </button>
      </div>

      <svg 
        ref={svgRef} 
        className="w-full h-full touch-none" 
        style={{ minHeight: '600px', outline: 'none' }} 
      />
    </div>
  );
}