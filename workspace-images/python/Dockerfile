FROM python:3.12-slim-bookworm

RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    vim \
    nano \
    htop \
    procps \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    flask \
    django \
    requests \
    httpx \
    pytest \
    black \
    ruff \
    ipython

RUN useradd -m -s /bin/bash coder
USER coder
WORKDIR /home/coder/project

CMD ["sleep", "infinity"]
