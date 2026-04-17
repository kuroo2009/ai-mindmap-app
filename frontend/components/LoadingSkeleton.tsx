"use client";

export default function LoadingSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50 p-10 space-y-8 animate-pulse">
      {/* Node trung tâm (To nhất) */}
      <div className="w-48 h-16 bg-blue-200 rounded-2xl shadow-sm"></div>

      {/* Đường nối giả */}
      <div className="w-1 h-12 bg-gray-200"></div>

      {/* Các Node con nằm ngang */}
      <div className="flex space-x-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-36 h-12 bg-gray-200 rounded-xl"></div>
          <div className="w-1 h-8 bg-gray-100"></div>
          <div className="w-28 h-10 bg-gray-100 rounded-lg"></div>
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="w-36 h-12 bg-gray-200 rounded-xl"></div>
          <div className="w-1 h-8 bg-gray-100"></div>
          <div className="w-28 h-10 bg-gray-100 rounded-lg"></div>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="w-36 h-12 bg-gray-200 rounded-xl"></div>
          <div className="w-1 h-8 bg-gray-100"></div>
          <div className="w-28 h-10 bg-gray-100 rounded-lg"></div>
        </div>
      </div>

      {/* Dòng chữ thông báo chạy hiệu ứng */}
      <div className="mt-8 flex flex-col items-center">
        <p className="text-blue-500 font-bold text-lg animate-bounce">
          AI đang "nghiền" kiến thức...
        </p>
        <p className="text-gray-400 text-sm">Vui lòng đợi trong giây lát để sơ đồ hiện hình</p>
      </div>
    </div>
  );
}