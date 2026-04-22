"use client";
import { createBrowserClient } from '@supabase/ssr';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const [origin, setOrigin] = useState("");

  // Chỉ lấy origin khi đã chạy ở phía trình duyệt (Client-side)
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-blue-50">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">
          Đăng nhập để lưu Mindmap
        </h1>
        
        {/* Chỉ hiển thị Auth khi đã xác định được origin để tránh lỗi Hydration */}
        {origin && (
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
            redirectTo={`${origin}/auth/callback`}
          />
        )}
      </div>
    </div>
  );
}