import os
import io
import json
import re  # Đưa lên đầu để dùng chung
from fastapi import FastAPI, UploadFile, File
import fitz  # PyMuPDF
from docx import Document
from openai import OpenAI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client

load_dotenv()

# --- CẤU HÌNH HỆ THỐNG ---
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

# --- HÀM BỔ TRỢ ---

async def ask_ai(text_content):
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b:free", 
        messages=[
            {
                "role": "system", 
                "content": "Bạn là chuyên gia giáo dục. Hãy tóm tắt văn bản thành JSON gồm 'Mindmap' (term, short_desc, detail, metaphor, example) và 'quizzes' (question, options, correct_answer). CHỈ TRẢ VỀ DỮ LIỆU JSON, KHÔNG GIẢI THÍCH, KHÔNG CHÀO HỎI."            },
            {
                "role": "user", 
                "content": f"Nội dung: {text_content[:8000]}"
            }
        ],
        response_format={ "type": "json_object" }
    )
    content = response.choices[0].message.content
    
    # TỐI ƯU: Làm sạch JSON ngay tại đây trước khi trả về
    try:
        match = re.search(r'\{.*\}', content, re.DOTALL)
        return match.group(0) if match else content
    except:
        return content

# --- ENDPOINT CHÍNH ---

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    text = ""

    # 1. Trích xuất Text
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

    # 2. Gửi text sang AI
    ai_result_raw = await ask_ai(text)
    
    # 3. Xử lý và Parse JSON để kiểm tra tính hợp lệ
    final_data = None
    try:
        final_data = json.loads(ai_result_raw)
    except Exception as e:
        # Nếu lỗi, thử dùng regex lần nữa cho chắc
        json_match = re.search(r"(\{.*\})", ai_result_raw, re.DOTALL)
        if json_match:
            try:
                final_data = json.loads(json_match.group(1))
            except:
                pass

    if not final_data:
        return {"error": "AI trả về dữ liệu không hợp lệ", "raw": ai_result_raw}

    # 4. LƯU VÀO SUPABASE (Phải làm TRƯỚC khi return)
    try:
        db_data = {
            "title": file.filename,
            "content": final_data # Lưu dạng Object JSON luôn (vì bảng dùng kiểu jsonb)
        }
        supabase.table("mindmaps").insert(db_data).execute()
        print(f"✅ Đã lưu '{file.filename}' vào Supabase!")
    except Exception as e:
        print(f"❌ Lỗi Supabase: {e}")
        # Không return ở đây để Frontend vẫn nhận được kết quả dù DB lỗi

    # 5. CUỐI CÙNG mới trả kết quả về Frontend
    return final_data