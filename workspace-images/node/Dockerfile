FROM node:20-bookworm-slim

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

RUN npm install -g pnpm yarn typescript ts-node nodemon

RUN useradd -m -s /bin/bash coder
USER coder
WORKDIR /home/coder/project

CMD ["sleep", "infinity"]
