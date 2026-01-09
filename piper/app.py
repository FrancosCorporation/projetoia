import subprocess
import os
from flask import Flask, request, send_file

app = Flask(__name__)

# CAMINHOS ABSOLUTOS DENTRO DO CONTAINER
PIPER_EXE = "/usr/bin/piper"  # Onde o Dockerfile instalou o binário
MODEL_PATH = "/app/voz.onnx"   # Onde o Dockerfile copiou o modelo

@app.route('/', methods=['POST'])
def generate_audio():
    data = request.json
    text = data.get('text')
    output_file = "/tmp/output.wav"

    # Comando para rodar o Piper
    command = [
        PIPER_EXE,
        "--model", MODEL_PATH,
        "--output_file", output_file
    ]

    try:
        # Executa o processo enviando o texto via stdin
        process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        stdout, stderr = process.communicate(input=text)

        if process.returncode != 0:
            print(f"Erro no Piper: {stderr}")
            return {"error": stderr}, 500

        return send_file(output_file, mimetype="audio/wav")
    except Exception as e:
        return {"error": str(e)}, 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)