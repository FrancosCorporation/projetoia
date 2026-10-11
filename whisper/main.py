import asyncio
import os
import tempfile
from pathlib import Path

import whisper
from fastapi import FastAPI, File, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

MAX_AUDIO_BYTES = 20 * 1024 * 1024
MODEL_SIZE = os.getenv("WHISPER_MODEL", "small")
MODEL_CACHE = os.getenv("WHISPER_CACHE_DIR", "/home/app/.cache/whisper")

app = FastAPI(title="Projeto IA Whisper", docs_url=None, redoc_url=None)
inference_lock = asyncio.Lock()

print(f"Carregando modelo Whisper {MODEL_SIZE} para inferência em CPU...")
model = whisper.load_model(MODEL_SIZE, device="cpu", download_root=MODEL_CACHE)


@app.get("/health")
def health_check():
    return {"status": "online", "model": MODEL_SIZE, "device": "cpu"}


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...), language: str = "pt"):
    content_type = (file.content_type or "").lower()
    if content_type and not (content_type.startswith("audio/") or content_type == "application/octet-stream"):
        raise HTTPException(status_code=415, detail="Envie um arquivo de áudio.")
    if language not in {"pt", "en", "es"}:
        raise HTTPException(status_code=400, detail="Idioma não permitido.")

    temp_path = None
    total_bytes = 0
    try:
        with tempfile.NamedTemporaryFile(prefix="projetoia-", suffix=".ogg", delete=False) as temp_file:
            temp_path = Path(temp_file.name)
            while chunk := await file.read(1024 * 1024):
                total_bytes += len(chunk)
                if total_bytes > MAX_AUDIO_BYTES:
                    raise HTTPException(status_code=413, detail="Áudio acima do limite de 20 MB.")
                temp_file.write(chunk)

        if total_bytes == 0:
            raise HTTPException(status_code=400, detail="Arquivo de áudio vazio.")

        async with inference_lock:
            result = await run_in_threadpool(model.transcribe, str(temp_path), language=language, fp16=False)
        transcript = result.get("text", "").strip()
        return {"text": transcript[:4000]}
    except HTTPException:
        raise
    except Exception as error:
        print(f"Falha na transcrição: {type(error).__name__}")
        raise HTTPException(status_code=502, detail="Não foi possível transcrever o áudio.") from None
    finally:
        await file.close()
        if temp_path:
            temp_path.unlink(missing_ok=True)
