FROM python:3.12-slim
WORKDIR /quality
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends libespeak-ng1 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 --create-home piper \
    && chown -R piper:piper /quality
RUN pip install --no-cache-dir "piper-tts[http]==1.8.0"
COPY --chown=piper:piper pt_BR-*.onnx* /quality/
USER piper
EXPOSE 5000
CMD ["python", "-m", "piper.http_server", "--host", "0.0.0.0", "--port", "5000", "--model", "/quality/pt_BR-faber-medium.onnx", "--data-dir", "/quality"]
