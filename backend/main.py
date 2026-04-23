import os
import io
import json
import re
from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Depends
import fitz  # PyMuPDF
from docx import Document
from openai import OpenAI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Kết nối Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# Kết nối OpenRouter
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

async def ask_ai(text_content):
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b:free", 
        messages=[
            {
                "role": "system", 
                "content": "Bạn là chuyên gia giáo dục. Hãy tóm tắt văn bản thành JSON gồm 'Mindmap' (term, short_desc, detail, metaphor, example) và 'quizzes' (question, options, correct_answer). CHỈ TRẢ VỀ DỮ LIỆU JSON, KHÔNG GIẢI THÍCH, KHÔNG CHÀO HỎI."
            },
            {
                "role": "user", 
                "content": f"Đây là nội dung tài liệu: {text_content[:8000]}"
            }
        ],
        response_format={ "type": "json_object" }
    )
    
    # Lấy nội dung thô từ AI
    content = response.choices[0].message.content
    
    # Làm sạch chuỗi JSON ngay tại đây
    try:
        match = re.search(r"(\{.*\})", content, re.DOTALL)
        return match.group(1) if match else content
    except:
        return content

# Hàm kiểm tra Token (Dependency)
async def get_current_user_id(authorization: str = Header(None)):
    print(f"Authorization Header nhận được: {authorization}")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bạn chưa đăng nhập!")
    
    # Tách chữ 'Bearer ' ra để lấy token
    token = authorization.replace("Bearer ", "")

    try:
        # Hỏi Supabase xem token này là của ai
        user = supabase.auth.get_user(token)
        return user.user.id
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=401, detail="Phiên đăng nhập hết hạn")

@app.post("/upload")
async def handle_upload(file: UploadFile = File(...),
                      user_id: str = Depends(get_current_user_id)): # Ép phải qua cổng kiểm tra
    contents = await file.read()
    text = ""

    # Trích xuất Text
    if file.filename.endswith(".pdf"):
        doc = fitz.open(stream=contents, filetype="pdf")
        for page in doc:
            text += page.get_text()
    elif file.filename.endswith(".docx"):
        doc = Document(io.BytesIO(contents))
        for para in doc.paragraphs:
            text += para.text + "\n"
    
    if not text.strip():
        return {"error": "Không thể trích xuất văn bản từ file."}

    # 2. Gửi sang AI và xử lý JSON
    ai_result_raw = await ask_ai(text)
    if not ai_result_raw:
         raise HTTPException(status_code=500, detail="AI không trả về kết quả.")
    try:
        # Chuyển chuỗi AI trả về thành Object Python
        final_json_data = json.loads(ai_result_raw)

        # LƯU VÀO DATABASE (Nằm sau khi parse thành công)
        db_insert = {
            "title": file.filename,
            "content": final_json_data,  # Supabase sẽ tự hiểu đây là JSONB
            "user_id": user_id, # Lưu đúng ID người chủ sở hữu
        }
        supabase.table("mindmaps").insert(db_insert).execute()

        return final_json_data
    
    except json.JSONDecodeError:
        print("Lỗi định dạng JSON từ AI")
        return {"error": "AI trả về dữ liệu không đúng định dạng JSON", "raw": ai_result_raw}
    except Exception as e:
        print(f"Lỗi khi lưu Database: {e}")
        raise HTTPException(status_code=500, detail="Lỗi lưu trữ dữ liệu")

# 1. API lấy danh sách tất cả mindmap (chỉ lấy tiêu đề và ID để nhẹ data)
@app.get("/history")
async def get_history(user_id: str = Depends(get_current_user_id)):
    try:
        response = (
            supabase.table("mindmaps")
            .select("id, title, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return response.data
    except Exception as e:
        print(f"Lỗi lấy lịch sử: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/mindmaps/{id}")
async def get_mindmap_detail(id: str, user_id: str = Depends(get_current_user_id)):
    try:
        print(f"--- DEBUG: Đang truy vấn Mindmap ID: {id} cho User: {user_id} ---")
        query_id = int(id) if id.isdigit() else id
        response = (
            supabase.table("mindmaps")
            .select("*")
            .eq("id", query_id)
            .eq("user_id", user_id)  # Chỉ trả về nếu là chủ sở hữu mới xem được
            .execute()
        )
        if not response.data or len(response.data) == 0:
            print("--- DEBUG: Không tìm thấy bản ghi nào khớp! ---")
            raise HTTPException(
                status_code=404, 
                detail="Không tìm thấy bản đồ hoặc bạn không có quyền truy cập."
            )
        return response.data[0]
    except Exception as e:
        print(f"Lỗi truy vấn: {e}")
        raise HTTPException(status_code=500, detail="Lỗi truy vấn")