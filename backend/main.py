import os
import io
import json
import re
from fastapi import FastAPI, UploadFile, File
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

    # 2. Gửi sang AI và xử lý JSON
    ai_result_raw = await ask_ai(text)
    
    final_json_data = None
    try:
        # Chuyển chuỗi thành Object Python để lưu vào jsonb
        final_json_data = json.loads(ai_result_raw)
    except Exception as e:
        print(f"❌ Lỗi Parse JSON: {e}")
        return {"error": "AI trả về dữ liệu rác", "debug": ai_result_raw}

    # 3. LƯU VÀO SUPABASE (Quan trọng: Phải kiểm tra dữ liệu trước khi lưu)
    if final_json_data:
        try:
            db_payload = {
                "title": str(file.filename),
                "content": final_json_data # Đây là Object, không phải chuỗi rỗng
            }
            supabase.table("mindmaps").insert(db_payload).execute()
            print(f"✅ Đã lưu '{file.filename}' vào database.")
        except Exception as e:
            # Nếu lỗi DB, ta in ra log nhưng vẫn cho Frontend nhận kết quả
            print(f"❌ Lỗi Supabase: {str(e)}") 

    # 4. CUỐI CÙNG mới trả về kết quả cho Frontend
    return final_json_data