FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt ./backend-requirements.txt
COPY ml/requirements.txt ./ml-requirements.txt
RUN pip install --no-cache-dir -r backend-requirements.txt && \
    pip install --no-cache-dir -r ml-requirements.txt
COPY backend ./backend
COPY ml ./ml

# Install gunicorn or other extra tools if needed
ENV PYTHONPATH=/app:/app/backend

EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
