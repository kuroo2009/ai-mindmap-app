"use client";
import { useEffect, useState } from 'react';
import Mindmap from '../components/Mindmap';
import Quiz from '../components/Quiz';
import HistoryDashboard from '../components/history'; 
import axios from 'axios'; // Đảm bảo đã cài axios
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface AISummaryData {
  Mindmap: any;
  quizzes: any[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ai-mindmap-eqi0.onrender.com";

export default function Home() {
  const [data, setData] = useState<AISummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState<any>(null);

  // Kiểm tra trạng thái đăng nhập khi load trang
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();

    // Lắng nghe thay đổi trạng thái auth (đăng nhập/đăng xuất)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // 1. Lấy chi tiết Mindmap từ Lịch sử (ĐÃ THÊM AUTH)
  const handleSelectHistory = async (id: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await axios.get(`${API_URL}/mindmaps/${id}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
    let finalContent = res.data.content;
      if (typeof finalContent === 'string') {
        finalContent = JSON.parse(finalContent);
      }

      if (finalContent) {
      setData(finalContent); 
      setShowQuiz(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert("Dữ liệu bản đồ bị trống!");
    }
  } catch (error) {
    console.error("Lỗi lấy chi tiết:", error);
    alert("Không thể tải bản đồ này. Kiểm tra console để biết chi tiết.");
  } finally {
    setLoading(false); // <--- QUAN TRỌNG: Phải tắt loading dù thành công hay thất bại
  }
};

  // 2. Upload file (Đồng bộ với Backend mới)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
        // Gửi token vào Header Authorization
        'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.status === 401) throw new Error("Unauthorized");

      const result = await res.json();
      
      if (result.error) {
        alert(result.error);
      } else {
        setData(result);
        setRefreshKey(prev => prev + 1); // Kích hoạt load lại lịch sử sau khi có dữ liệu mới
      }
    } catch (error) {
      console.error("Lỗi kết nối Backend:", error);
      alert("Có lỗi xảy ra khi xử lý file.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setData(null); // Xóa dữ liệu hiện tại khi logout
  };

  return (
    <main className="flex flex-col items-center p-6 min-h-screen bg-slate-50">
      <h1 className="text-3xl font-bold mb-4 text-blue-600">AI Mindmap Learning</h1>
      
      {/* Thanh điều hướng Auth */}
      <nav className="w-full max-w-6xl flex justify-end p-2 mb-4">
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Chào, <strong>{user.email}</strong></span>
            <button 
              onClick={handleLogout}
              className="px-5 py-2 bg-red-50 text-red-600 rounded-full text-sm font-medium hover:bg-red-100 transition"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <Link href="/login">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition">
              Đăng nhập
            </button>
          </Link>
        )}
      </nav>

      {/* KHU VỰC UPLOAD */}
      <div className="w-full max-w-4xl mb-10 p-8 bg-white rounded-3xl shadow-sm border-2 border-dashed border-blue-100 transition-all hover:border-blue-300">
        <input 
          type="file" 
          onChange={handleFileUpload} 
          disabled={!user || loading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        />
        {!user && <p className="text-xs text-red-400 mt-2 text-center">Bạn cần đăng nhập để tải tài liệu lên.</p>}
        
        {loading && (
          <div className="mt-8 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-blue-500 font-medium">AI đang "đọc" tài liệu của bạn...</p>
          </div>
        )}
      </div>

      {/* HIỂN THỊ KẾT QUẢ */}
      {data && !loading && (
        <div className="w-full max-w-6xl space-y-10 mb-20">
          <div className="w-full h-150 border shadow-2xl rounded-3xl overflow-hidden bg-white relative">
            <Mindmap nodesData={data.Mindmap} />
          </div>
          
          <div className="flex justify-center">
            <button 
              onClick={() => setShowQuiz(!showQuiz)}
              className="px-8 py-4 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
            >
              {showQuiz ? "← Quay lại Sơ đồ" : "🔥 Bắt đầu Thử thách Quiz"}
            </button>
          </div>

          {showQuiz && (
            <div className="animate-in slide-in-from-bottom-5 duration-500">
               <Quiz questions={data.quizzes} />
            </div>
          )}
        </div>
      )}

      {/* KHU VỰC LỊCH SỬ */}
      {user && (
        <section className="w-full max-w-6xl mt-10">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-800">Kho kiến thức của bạn</h2>
          </div>
          
          <div className="bg-white p-2 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <HistoryDashboard key={refreshKey} onSelectMindmap={handleSelectHistory} />
          </div>
        </section>
      )}
    </main>
  );
}