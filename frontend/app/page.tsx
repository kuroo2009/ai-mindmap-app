"use client";
console.log("URL nè:", process.env.NEXT_PUBLIC_SUPABASE_URL);
import { useState } from 'react';
import Mindmap from '../components/Mindmap';
import Quiz from '../components/Quiz';
import { supabase } from '../lib/supabase';
import LoadingSkeleton from '../components/LoadingSkeleton';
import HistoryDashboard from '../components/history'; // Đường dẫn tới file bạn vừa tạo

interface AISummaryData {
  Mindmap: any[];
  quizzes: any[];
}

export default function Home() {
  const [data, setData] = useState<AISummaryData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      // BƯỚC 1: Gọi API và đợi phản hồi (Lúc này mới tạo ra biến 'res')
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ai-mindmap-eqi0.onrender.com";
      const handleUpload = async (file: File) => {
  // Debug: In ra để xem nó có lấy được link Render không
  console.log("Đang gọi tới địa chỉ:", API_URL);

  if (!API_URL) {
    alert("Lỗi: Chưa cấu hình địa chỉ API!");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_URL}/upload`, { // Thay /process-pdf bằng endpoint thật của bạn
    method: "POST",
    body: formData,
  });
  
  // ... xử lý tiếp
};
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      // BƯỚC 2: Chuyển phản hồi thành JSON
      const result = await res.json();
      console.log("Dữ liệu thực tế từ AI:", result); // Kiểm tra xem có đúng là result.mindmap không

      if (result.error) {
        alert("AI đang bị 'say nắng', bạn hãy thử upload lại file nhé!");
        console.error("Lỗi AI:", result.debug_raw);
      } else {
        // BƯỚC 3: Debug và Lưu dữ liệu (Biến 'result' đã sẵn sàng)
      console.log("Dữ liệu từ AI trả về:", result); // THÊM DÒNG NÀY ĐỂ DEBUG
      setData(result);
      }
      

    } catch (error) {
      console.error("Lỗi kết nối Backend:", error);
    } finally {
      setLoading(false);
    }
  };
  
const [showQuiz, setShowQuiz] = useState(false);
const SkeletonLoader = () => (
  <div className="w-full h-full flex flex-col items-center justify-center space-y-4 animate-pulse">
    <div className="flex space-x-8">
      <div className="w-32 h-12 bg-gray-200 rounded-lg"></div>
      <div className="w-32 h-12 bg-gray-200 rounded-lg"></div>
    </div>
    <div className="w-1 h-20 bg-gray-100"></div>
    <div className="w-48 h-16 bg-blue-100 rounded-xl"></div>
    <p className="text-gray-400 font-medium mt-4">AI đang phân tích kiến thức sâu sắc cho bạn...</p>
  </div>
);
  return (
    <main className="flex flex-col items-center p-6 min-h-screen bg-slate-50">
      {/* ... Phần Tiêu đề và Nút Upload ... */}
      <h1 className="text-3xl font-bold mb-8 text-blue-600">AI Mindmap Learning</h1>
      
      <div className="mb-10 p-6 bg-white rounded-lg shadow-md">
        <input type="file" onChange={handleFileUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
        {loading && (
      <div className="w-full h-600px border-2 border-gray-100 rounded-3xl bg-white flex items-center justify-center">
        <SkeletonLoader />
      </div>
        )}
      </div>

      {/* HIỂN THỊ KHI ĐÃ CÓ DỮ LIỆU */}
      {data && !loading && (
        <div className="w-full max-w-6xl space-y-10 animate-in fade-in duration-700">
          <div className="w-full h-150 border-2 border-white shadow-2xl rounded-3xl overflow-hidden bg-white relative">
            <Mindmap nodesData={data?.Mindmap || data?.Mindmap} />
          </div>
          {/* Nút chuyển sang Quiz */}
          <div className="flex justify-center">
            <button 
              onClick={() => setShowQuiz(!showQuiz)}
              className="px-8 py-4 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform"
            >
              {showQuiz ? "Quay lại Sơ đồ" : "🔥 Bắt đầu Thử thách Quiz"}
            </button>
          </div>
          {/* Khu vực Quiz */}
          {showQuiz && (
            <div className="animate-in fade-in zoom-in duration-500 pb-20">
               <Quiz questions={data.quizzes} />
            </div>
          )}
        </div>
      )}
    </main>
  );
  function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="App">
      <h1>AI Mindmap Generator</h1>
      
      {/* Khu vực hiển thị Dashboard Lịch sử */}
      <section className="mt-8">
        <h2 className="text-xl font-bold">Lịch sử đã tạo</h2>
        <HistoryDashboard onSelectMindmap={(id: string) => setSelectedId(id)} />
      </section>

      {/* Khi chọn một ID, bạn sẽ gọi API lấy chi tiết để hiển thị */}
      {selectedId && (
        <div className="mt-4">
          <p>Đang xem bản đồ số: {selectedId}</p>
          {/* Component hiển thị chi tiết Mindmap sẽ nằm ở đây */}
        </div>
      )}
    </div>
  );
}
}
