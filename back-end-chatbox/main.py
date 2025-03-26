import threading
import time
from flask import Flask, request, jsonify, send_file
from flask_caching import Cache
from flask_cors import CORS
import librosa
import noisereduce as nr
import numpy as np
import io
import torch
from transformers import pipeline
from pyannote.audio import Model
from pyannote.audio.pipelines import VoiceActivityDetection
from dotenv import load_dotenv
import os
import google.generativeai as genai
from pydub import AudioSegment
import ffmpeg
import uuid
from datetime import datetime
from gtts import gTTS
import tempfile

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# ------------------------------
# 1. Thiết lập môi trường
# ------------------------------
load_dotenv()

api_key = os.getenv("API_KEY")
hub_key = os.getenv("HUB_KEY")

questions = {
    "Trí tuệ nhân tạo": ["AI có thể thay thế con người không?", "Làm thế nào để học AI?"],
    "Thể thao": ["Ai vô địch World Cup 2022?", "Cristiano Ronaldo chơi ở đội nào?"],
    "Điện ảnh": ["Phim nào đoạt giải Oscar 2023?", "Đạo diễn của Interstellar là ai?"],
    "Khác": []
}

# ------------------------------
# 2. Khởi tạo các pipeline
# ------------------------------
try:
    genai.configure(api_key=api_key)
    vad_model = Model.from_pretrained("pyannote/segmentation", use_auth_token=hub_key)
    vad_pipeline = VoiceActivityDetection(segmentation=vad_model)
    vad_pipeline.instantiate({
        "onset": 0.5,
        "offset": 0.5,
        "min_duration_on": 0.0,
        "min_duration_off": 0.0
    })
    print("Pipelines initialized pyannote successfully.")
    asr_pipeline = pipeline(
        "automatic-speech-recognition",
        model="openai/whisper-large-v3-turbo",
        device=0 if torch.cuda.is_available() else -1,
    )
    print("Pipelines initialized whisper successfully.")
    intent_classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
    print("Pipelines initialized successfully.")
except Exception as e:
    print(f"Lỗi khi tải các pipeline: {e}")
    vad_pipeline = None
    asr_pipeline = None
    intent_classifier = None

# ------------------------------
# 4. Hàm hỗ trợ
# ------------------------------
def load_audio_bytes(audio_bytes):
    try:
        # Đọc file âm thanh từ bytes với định dạng 'wav'
        audio = AudioSegment.from_file(io.BytesIO(audio_bytes), format='wav')

        # Chuyển đổi AudioSegment thành numpy array
        audio_data = np.array(audio.get_array_of_samples()).astype(np.float32)
        sample_rate = audio.frame_rate

        # Nếu âm thanh là stereo, chuyển thành mono
        if audio.channels > 1:
            audio_data = audio_data.reshape((-1, audio.channels))
            audio_data = audio_data.mean(axis=1)

        # Chuẩn hóa âm thanh về khoảng [-1, 1]
        audio_data = audio_data / np.iinfo(np.int16).max

        return audio_data, sample_rate
    except Exception as e:
        raise ValueError(f"Lỗi khi đọc file âm thanh: {e}")

def apply_vad(audio_data, sample_rate):
    try:
        if audio_data.dtype != np.float32:
            audio_data = audio_data.astype(np.float32)
        waveform = torch.tensor(audio_data).unsqueeze(0)
        vad_result = vad_pipeline({"waveform": waveform, "sample_rate": sample_rate})
        voiced_segments = []
        MIN_SEGMENT_DURATION = 1.0  # Giây
        for segment in vad_result.get_timeline():
            duration = segment.end - segment.start
            if duration >= MIN_SEGMENT_DURATION:
                start = int(segment.start * sample_rate)
                end = int(segment.end * sample_rate)
                voiced_segment = audio_data[start:end]
                if len(voiced_segment) > 0:
                    voiced_segments.append(voiced_segment)
        print(f"Phát hiện {len(voiced_segments)} đoạn giọng nói sau khi lọc.")
        return voiced_segments
    except Exception as e:
        raise ValueError(f"Lỗi khi áp dụng VAD: {e}")

def transcribe_audio(segment, sample_rate):
    try:
        print(f"Đang chuyển đoạn âm thanh dài {len(segment)} mẫu.")
        input_data = {
            "array": segment,
            "sampling_rate": sample_rate
        }
        return asr_pipeline(input_data)["text"]
    except Exception as e:
        print(f"Lỗi khi Speech to text: {e}")
        return ""

def classify_intent(text):
    try:
        labels = ["Trí tuệ nhân tạo", "Thể thao", "Điện ảnh", "Khác"]
        result = intent_classifier(text, candidate_labels=labels)
        return result["labels"][0], result["scores"][0]
    except Exception as e:
        print(f"Lỗi khi phân loại ý định: {e}")
        return "Khác", 0.0

def generate_ai_response(text):
    try:
        prompt = f"""
        Lưu ý câu trả lời không được có các ký tự đặt biệt như là dấu: '*'
        Câu trả lời phải tách từ đoạn  ra rõ ràng
        Trả lời câu hỏi sau: {text}."""

        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=prompt
        )
        response = model.generate_content(text)
        return response.text
    except Exception as e:
        print(f"Lỗi khi gọi Generative AI: {e}")
        return "Không thể tạo phản hồi tại thời điểm này."
    
    
def generate_ai_response_fix(text):
    try:
        prompt = (
                    f"Chỉnh lại lỗi chính tả và ngữ pháp cho câu sau: {text}"
                )

        # Gửi yêu cầu tạo nội dung đến Generative AI
        model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=prompt
            )
        response = model.generate_content(text)
        return response.text
    except Exception as e:
        return "Không thể tạo phản hồi tại thời điểm này."

def text_to_speech(text,key,path,lang='vi'):
    try:
        tts = gTTS(text=text, lang=lang)
        file_path = os.path.join(path, f"{key}.mp3")
        tts.save(file_path)
        return file_path
    except Exception as e:
        print(f"Lỗi khi lưu file: {e}")
        return None

def reduce_noise(audio_data, sample_rate):
    try:
        # Sử dụng thư viện noisereduce để khử nhiễu
        reduced_noise = nr.reduce_noise(y=audio_data, sr=sample_rate)
        return reduced_noise
    except Exception as e:
        print(f"Lỗi khi khử nhiễu âm thanh: {e}")
        return audio_data  

cache = Cache(app, config={'CACHE_TYPE': 'SimpleCache', 'CACHE_DEFAULT_TIMEOUT': 3600})



@app.route("/upload-audio", methods=["POST"])
def upload_audio():
    try:
        file = request.files['file']
        audio_bytes = file.read()
        unique_id = str(uuid.uuid4())
        save_dir = 'saved_audio_files'
        os.makedirs(save_dir, exist_ok=True)
        current_date = datetime.now().strftime('%Y-%m-%d')
        date_dir = os.path.join(save_dir, current_date)
        os.makedirs(date_dir, exist_ok=True)

        # Reset cache trước khi bắt đầu
        cache.set("process_audio_status", {})

        start_time = time.perf_counter()

        steps = [
            "Tiền xử lý",
            "Speech to text",
            "Phân loại ý định",
            "Tạo phản hồi",
        ]

        # Khởi tạo trạng thái ban đầu
        cache.set("process_audio_status", {step: "wait" for step in steps})
        cache_status = cache.get("process_audio_status")


        # Bước 3: Lưu file .webm gốc
        temp_input_path = os.path.join(date_dir, f"{unique_id}.webm")
        temp_output_path = os.path.join(date_dir, f"{unique_id}.wav")
        with open(temp_input_path, 'wb') as temp_input_file:
            temp_input_file.write(audio_bytes)


        # Bước 4: Chuyển đổi sang .wav
        ffmpeg.input(temp_input_path).output(temp_output_path).run(overwrite_output=True)


        # Bước 5: Đọc dữ liệu âm thanh từ file .wav
        with open(temp_output_path, 'rb') as f:
            wav_bytes = f.read()

        # Bước 6: Khử nhiễu âm thanh
        cache_status["Tiền xử lý"] = "process"
        cache.set("process_audio_status", cache_status)
        audio_data, sample_rate = load_audio_bytes(wav_bytes)


        # Bước 7: Áp dụng VAD

        segments = apply_vad(audio_data, sample_rate=sample_rate)
        cache_status["Tiền xử lý"] = "finish"
        cache.set("process_audio_status", cache_status)

        if not segments:
            processing_time = time.perf_counter() - start_time
            cache.set("process_audio_status", {})
            return jsonify({
                "error": "Không phát hiện giọng nói trong âm thanh.",
                "processing_time_seconds": processing_time
            }), 400
            

        # Bước 8: Ghép các đoạn âm thanh
        combined_segment = np.concatenate(segments)

        # Bước 9: Speech to text
        cache_status["Speech to text"] = "process"
        cache.set("process_audio_status", cache_status)
        full_text = transcribe_audio(combined_segment, sample_rate)
        cache_status["Speech to text"] = "finish"
        cache.set("process_audio_status", cache_status)
        

        ai_response_fix = generate_ai_response_fix(full_text)


        # Bước 10: Phân loại ý định
        cache_status["Phân loại ý định"] = "process"
        cache.set("process_audio_status", cache_status)
        label, confidence = classify_intent(ai_response_fix)
        cache_status["Phân loại ý định"] = "finish"
        cache.set("process_audio_status", cache_status)

        if confidence > 0.5 and questions.get(label):
            recommend = questions[label]
        else:
            recommend = []

        # Bước 11: Tạo phản hồi
        cache_status["Tạo phản hồi"] = "process"
        cache.set("process_audio_status", cache_status)
        ai_response = generate_ai_response(ai_response_fix)


        # Bước 12: Chuyển đổi phản hồi AI thành âm thanh
        ai_audio_path = text_to_speech(ai_response, unique_id, date_dir, lang='vi')
        if not ai_audio_path:
            processing_time = time.perf_counter() - start_time
            cache.set("process_audio_status", {})
            return jsonify({
                "error": "Lỗi khi chuyển đổi phản hồi thành âm thanh.",
                "processing_time_seconds": processing_time
            }), 500
            
        cache_status["Tạo phản hồi"] = "finish"
        cache.set("process_audio_status", cache_status)

        # Bước 13: Xóa các file tạm
        try:
            os.remove(temp_input_path)
            os.remove(temp_output_path)
            print(f"Đã xóa các file tạm: {temp_input_path}, {temp_output_path}")
        except Exception as e:
            print(f"Lỗi khi xóa file tạm: {e}")


        # Bước 14: Hoàn thành xử lý
        processing_time = time.perf_counter() - start_time
        cache_status["Hoàn thành xử lý"] = "finish"
        cache.set("process_audio_status", cache_status)

        return jsonify({
            "transcribed_text": ai_response_fix,
            "ai_response": ai_response,
            "recommend": recommend,
            "confidence": confidence,
            "ai_audio": f"{unique_id}",
            "processing_time_seconds": processing_time  
        }), 200

    except Exception as e:
        print(f"Exception: {e}")
        end_time = time.perf_counter()
        processing_time = end_time - start_time
        return jsonify({
            "error": f"Lỗi xử lý âm thanh: {e}",
            "processing_time_seconds": processing_time
        }), 500




@app.route("/process-status", methods=["GET"])
def process_status():
    status = cache.get("process_audio_status")
    if status is None:
        return jsonify({"error": "Không có quá trình xử lý nào đang diễn ra."}), 404
    return jsonify({"status": status}), 200


@app.route("/ai-audio/<audio_id>", methods=["GET"])
def get_ai_audio(audio_id):
    try:
        date_dir = os.path.join('saved_audio_files', datetime.now().strftime('%Y-%m-%d'))
        audio_path = os.path.join(date_dir, f"{audio_id}.mp3")
        print(audio_path)
        if os.path.exists(audio_path):
            return send_file(audio_path, mimetype="audio/mpeg")
        else:
            return jsonify({"error": "Không tìm thấy file âm thanh."}), 404
    except Exception as e:
        print(f"Lỗi khi phục vụ âm thanh: {e}")
        return jsonify({"error": f"Lỗi khi phục vụ âm thanh: {e}"}), 500

if __name__ == "__main__":
    app.run(debug=False)
