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
    try:
        # Bước 1: Parse chuỗi AI trả về thành Dictionary (Object Python)
        # Nếu ai_result_raw đã là chuỗi JSON, json.loads sẽ làm sạch nó
        final_json_data = json.loads(ai_result_raw)
        
        # Bước 2: Lưu vào Supabase
        # Đảm bảo truyền 'final_json_data' (là Dictionary), KHÔNG truyền 'ai_result_raw' (là String)
        db_insert = {
            "title": file.filename,
            "content": final_json_data  # Supabase sẽ tự hiểu đây là JSONB
        }
        
        response = supabase.table("mindmaps").insert(db_insert).execute()
        
        # Bước 3: Trả về chính Object đó cho Frontend
        return final_json_data

    except Exception as e:
        print(f"Error: {e}")
        # Nếu parse lỗi, hãy kiểm tra xem AI có trả về text thừa không
        return {"error": str(e), "raw": ai_result_raw}

