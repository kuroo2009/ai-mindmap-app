import React, { useEffect, useState } from 'react';
import axios from 'axios';

const HistoryDashboard = ({ onSelectMindmap }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy danh sách lịch sử từ Backend Render
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const API_URL = "https://ai-mindmap-eqi0.onrender.com"; 
        const res = await axios.get(`${API_URL}/history`);
        console.log("Danh sách lịch sử nhận được:", res.data); // Xem ở F12 Console
        setHistory(res.data);
      } catch (err) {
        console.error("Lỗi lấy lịch sử:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <p className="text-gray-500">Đang tải lịch sử...</p>;

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