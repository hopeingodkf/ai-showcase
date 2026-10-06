import os
import subprocess
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import requests
from fastapi.middleware.cors import CORSMiddleware
import time
import shutil

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    character_id: int
    text: str

VOICE_MAPPING = {
    1: {"voice": "Денис Денисенко", "image": "b1.png"}, # Макс
    2: {"voice": "Артем Окороков", "image": "b2.png"}, # Лео
    3: {"voice": "Інна Гелевера", "image": "b3.png"},  # Єва
    4: {"voice": "голос12", "image": "b4.png"}     # Міа
}

SADTALKER_DIR = r"D:\testblogers\SadTalker"
RESULTS_DIR = os.path.join(SADTALKER_DIR, "results")
PUBLIC_VIDEOS_DIR = r"D:\testblogers\ai-showcase\public\videos"

os.makedirs(PUBLIC_VIDEOS_DIR, exist_ok=True)

@app.post("/api/chat")
async def chat_with_blogger(req: ChatRequest):
    if req.character_id not in VOICE_MAPPING:
        raise HTTPException(status_code=400, detail="Unknown character")
    
    char_info = VOICE_MAPPING[req.character_id]
    voice_name = char_info["voice"]
    image_name = char_info["image"]
    
    # 1. Запит до StyleTTS2 (який працює на порту 8000)
    print(f"[{char_info['voice']}] Генерую аудіо для: {req.text}")
    tts_payload = {
        "blocks": [
            {
                "text": req.text,
                "voice": voice_name,
                "speed": 1.0
            }
        ]
    }
    
    try:
        tts_response = requests.post("http://127.0.0.1:8000/api/generate", json=tts_payload)
        tts_response.raise_for_status()
    except Exception as e:
        print("Помилка підключення до StyleTTS2. Перевір чи запущений api_server.py на порту 8000!")
        raise HTTPException(status_code=500, detail="TTS Engine is not running")

    audio_path = os.path.join(SADTALKER_DIR, "inputs", f"temp_{req.character_id}.wav")
    with open(audio_path, "wb") as f:
        f.write(tts_response.content)
        
    # 2. Виклик SadTalker
    image_path = os.path.join(SADTALKER_DIR, "inputs", image_name)
    print(f"[{char_info['voice']}] Запускаю SadTalker для {image_name} та {audio_path}...")
    
    # Запуск SadTalker через наш .bat
    cmd = f'run_lipsync.bat "inputs\\temp_{req.character_id}.wav" "inputs\\{image_name}"'
    
    process = subprocess.Popen(cmd, cwd=SADTALKER_DIR, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for line in process.stdout:
        pass # Просто чекаємо завершення і можна виводити лог
    process.wait()
    
    # 3. Знаходимо останнє згенероване відео
    # SadTalker створює папку в результатах з назвою дати/часу
    # Простіше знайти найновіший .mp4 в папці results
    all_videos = []
    for root, _, files in os.walk(RESULTS_DIR):
        for file in files:
            if file.endswith(".mp4"):
                all_videos.append(os.path.join(root, file))
                
    if not all_videos:
        raise HTTPException(status_code=500, detail="Video generation failed")
        
    latest_video = max(all_videos, key=os.path.getctime)
    
    # Копіюємо відео у публічну папку React
    output_filename = f"response_{req.character_id}_{int(time.time())}.mp4"
    public_video_path = os.path.join(PUBLIC_VIDEOS_DIR, output_filename)
    shutil.copy(latest_video, public_video_path)
    
    print(f"[{char_info['voice']}] Відео готове: {public_video_path}")
    
    # Віддаємо шлях до відео відносно public/
    return {"video_url": f"/videos/{output_filename}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend:app", host="127.0.0.1", port=5000)
