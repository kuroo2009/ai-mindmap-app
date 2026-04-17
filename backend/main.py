import os
import io
import json
from fastapi import FastAPI, UploadFile, File
import fitz  # PyMuPDF
from docx import Document
from openai import OpenAI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

app = FastAPI()

# TỐI ƯU: Cấu hình CORS để Frontend có thể gọi được API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép tất cả (tốt cho việc phát triển)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Cấu hình OpenRouter
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

async def ask_ai(text_content):
    response = client.chat.completions.create(
        # Thay model tương ứng trên OpenRouter, ví dụ: "meta-llama/llama-3-70b-instruct" 
        # Hoặc tên chính xác của gpt-oss-120b nếu OpenRouter niêm yết vậy
        model="openai/gpt-oss-20b:free", 
        messages=[
            {
                "role": "system", 
                "content": "Bạn là chuyên gia giáo dục. Hãy tóm tắt văn bản thành JSON gồm 'Mindmap' (term, short_desc, detail, metaphor, example) và 'quizzes' (question, options, correct_answer). CHỈ TRẢ VỀ DỮ LIỆU JSON, KHÔNG GIẢI THÍCH, KHÔNG CHÀO HỎI."
            },
            {
                "role": "user", 
                "content": f"Đây là nội dung tài liệu: {text_content[:8000]}" # Tận dụng context window lớn hơn của OSS
            }
        ],
        response_format={ "type": "json_object" }
    )
    return response.choices[0].message.content
    # TỐI ƯU: Chỉ lấy phần nằm trong cặp ngoặc nhọn đề phòng AI nói thừa
    match = re.search(r'\{.*\}', content, re.DOTALL)
    return match.group(0) if match else content
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    text = ""

    # 1. Trích xuất Text từ File
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

    # 2. Gửi text sang AI (OpenRouter)
    ai_result_raw = await ask_ai(text)
    
    # 3. Trả về kết quả
    try:
        # Cách 1: Thử parse trực tiếp
        return json.loads(ai_result_raw)
    except:
        # Cách 2: Nếu lỗi, dùng Regex để tìm đúng khối { ... }
        import re
        try:
            # Tìm đoạn văn bản bắt đầu bằng { và kết thúc bằng }
            json_match = re.search(r"(\{.*\})", ai_result_raw, re.DOTALL)
            if json_match:
                clean_json = json_match.group(1)
                return json.loads(clean_json)
        except:
            pass
        
        # Nếu vẫn hỏng, trả về lỗi chi tiết để bạn biết đường sửa
        return {"error": "AI trả về rác", "debug_raw": ai_result_raw}