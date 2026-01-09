import torch
import torch_directml
from fastapi import FastAPI, UploadFile, File
import whisper
import os

app = FastAPI()

# Inicializa DirectML para placa AMD
device = torch_directml.device()
print(f"🚀 SISTEMA: Usando dispositivo: {device}")

# Carrega o modelo Small
# Nota: O modelo é carregado em CPU para evitar incompatibilidades de drivers DirectML 
# com a biblioteca Whisper original, mas você pode testar mudar para device=device
print("📥 Carregando modelo Whisper Small...")
model = whisper.load_model("small") 

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    try:
        # Salva o arquivo enviado pelo Bot temporariamente
        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())
        
        # Transcrição:
        # language="pt" -> força português
        # fp16=False -> OBRIGATÓRIO para placas AMD/CPU comum
        result = model.transcribe(
            temp_path, 
            language="pt", 
            fp16=False
        )
        
        return {"text": result["text"]}
    except Exception as e:
        print(f"❌ Erro interno: {e}")
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.get("/")
def health_check():
    return {"status": "online", "model": "whisper-small"}