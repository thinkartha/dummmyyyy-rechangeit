FROM python:3.12-alpine
WORKDIR /app
COPY agent.py /app/agent.py
RUN addgroup -S gateway && adduser -S gateway -G gateway
USER gateway
CMD ["python", "/app/agent.py"]
