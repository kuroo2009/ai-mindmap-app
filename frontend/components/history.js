import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const HistoryDashboard = ({ onSelectMindmap }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy danh sách lịch sử từ Backend Render
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.log("Chưa có session, bỏ qua fetch lịch sử");
          setLoading(false);
          return;
        }

        const API_URL = "https://ai-mindmap-eqi0.onrender.com"; 
        const res = await axios.get(`${API_URL}/history`, {
          headers: {
          'Authorization': `Bearer ${session.access_token}`
          }
        });

        setHistory(res.data);
      } catch (err) {
        console.error("Lỗi lấy lịch sử:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) return (
    <div className="p-10 text-center">
      <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 mt-2">Đang tải lịch sử...</p>
    </div>
  );

  if (history.length === 0) return (
    <div className="p-10 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
      Chưa có sơ đồ nào được tạo. Hãy thử upload một file nhé!
    </div>
  );
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {history.map((item) => (
        <div 
          key={item.id} 
          onClick={() => onSelectMindmap(item.id)}
          className="p-4 border rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all bg-white border-blue-100"
        >
          <h3 className="font-bold text-blue-800 truncate">{item.title}</h3>
          <p className="text-xs text-gray-400 mt-2">
            Ngày tạo: {new Date(item.created_at).toLocaleDateString('vi-VN')}
          </p>
        </div>
      ))}
    </div>
  );
};

export default HistoryDashboard;