FROM python:3.9-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY face_detection_yunet_2023mar.onnx face_recognition_sface_2021dec.onnx ./
COPY . .
EXPOSE 8001
CMD ["python", "app.py"]
