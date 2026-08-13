FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Verify model artifacts exist at build time
RUN python -c "import joblib, os; assert os.path.exists('models/surge_model.pkl'), 'Model missing'; print('Model verified')"

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5001/api/ai/health', timeout=3)" || exit 1

CMD ["python", "app.py"]