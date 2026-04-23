"use client";
import { useState } from 'react';
import Mindmap from '../components/Mindmap';
import Quiz from '../components/Quiz';
import LoadingSkeleton from '../components/LoadingSkeleton';
import HistoryDashboard from '../components/history'; 
import axios from 'axios'; // Đảm bảo đã cài axios
import Link from 'next/link';
import LoginSignup from './login/page'; // Import trang login/signup
import { supabase } from '@/lib/supabase';

interface AISummaryData {
  Mindmap: any[];
  quizzes: any[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ai-mindmap-eqi0.onrender.com";

export default function Home() {
  const [data, setData] = useState<AISummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  // THÊM DÒNG NÀY: Dùng để kích hoạt load lại lịch sử
  const [refreshKey, setRefreshKey] = useState(0);

  // 1. Logic xử lý khi bấm vào một item trong Lịch sử
  const handleSelectHistory = async (id: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/mindmaps/${id}`);
      // Lưu ý: Backend trả về { id, title, content, ... } 
      // Chúng ta cần lấy phần 'content' để hiển thị
      setData(res.data.content); 
      setShowQuiz(false); // Reset lại view về sơ đồ
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Cuộn lên đầu để xem
    } catch (error) {
      console.error("Lỗi lấy chi tiết mindmap:", error);
      alert("Không thể tải bản đồ này!");
    } finally {
      setLoading(false);
    }
  };

  // 2. Logic Upload file (Giữ nguyên của bạn nhưng dọn dẹp lại cho sạch)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setLoading(true);
    // Lấy Token từ Supabase Session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Debug thử xem token có tồn tại không (F12 Console)
    console.log("Token hiện tại:", token);

    if (!token) {
      alert("Vui lòng đăng nhập để sử dụng tính năng này!");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
        // Gửi token vào Header Authorization
        'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.status === 401) {
      alert("Backend báo lỗi: Chưa đăng nhập hoặc Token hết hạn");
      return;
      }

      const result = await res.json();
      
      if (result.error) {
        alert("AI đang bận, hãy thử lại nhé!");
      } else {
        setData(result);
        setRefreshKey(prev => prev + 1); // Kích hoạt load lại lịch sử sau khi có dữ liệu mới
      }
    } catch (error) {
      console.error("Lỗi kết nối Backend:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center p-6 min-h-screen bg-slate-50">
      <h1 className="text-3xl font-bold mb-8 text-blue-600">AI Mindmap Learning</h1>
      {/* Phần đăng nhập */}
      <nav className="w-full flex justify-end p-4">
        <Link href="/login">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition">
            Đăng nhập
          </button>
        </Link>
      </nav>
      {/* KHU VỰC UPLOAD */}
      <div className="w-full max-w-4xl mb-10 p-6 bg-white rounded-lg shadow-md border-2 border-dashed border-blue-100">
        <input 
          type="file" 
          onChange={handleFileUpload} 
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {loading && (
          <div className="mt-6 w-full h-100 flex items-center justify-center">
             <p className="animate-bounce text-blue-500 font-bold">Đang xử lý dữ liệu...</p>
          </div>
        )}
      </div>

      {/* HIỂN THỊ KẾT QUẢ (MINDMAP/QUIZ) */}
      {data && !loading && (
        <div className="w-full max-w-6xl space-y-10 mb-20 animate-in fade-in duration-700">
          <div className="w-full h-150 border-2 border-white shadow-2xl rounded-3xl overflow-hidden bg-white relative">
            <Mindmap nodesData={data.Mindmap} />
          </div>
          
          <div className="flex justify-center">
            <button 
              onClick={() => setShowQuiz(!showQuiz)}
              className="px-8 py-4 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform"
            >
              {showQuiz ? "← Quay lại Sơ đồ" : "🔥 Bắt đầu Thử thách Quiz"}
            </button>
          </div>

          {showQuiz && (
            <div className="animate-in slide-in-from-bottom-10 duration-500">
               <Quiz questions={data.quizzes} />
            </div>
          )}
          <hr className="border-gray-200" />
        </div>
      )}

      {/* KHU VỰC LỊCH SỬ (Luôn hiển thị ở dưới) */}
      <section className="w-full max-w-6xl mt-10">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-800">Lịch sử kiến thức của bạn</h2>
        </div>
        
        {/* Truyền hàm handleSelectHistory vào Component History */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <HistoryDashboard key={refreshKey} onSelectMindmap={handleSelectHistory} />
        </div>
      </section>
    </main>
  );
}