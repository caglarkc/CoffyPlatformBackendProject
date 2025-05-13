FROM node:18-alpine

WORKDIR /app

# Önce package.json dosyalarını kopyala ve bağımlılıkları yükle
COPY services/user-auth-service/package*.json ./services/user-auth-service/
COPY shared/package*.json ./shared/
COPY package*.json ./

# Root seviyesindeki bağımlılıkları yükle
RUN npm install

# Shared klasörünün bağımlılıklarını yükle
RUN cd shared && npm install

# User Auth Service bağımlılıklarını yükle
RUN cd services/user-auth-service && npm install

# Şimdi tüm dosyaları kopyala
COPY shared ./shared
COPY services/user-auth-service ./services/user-auth-service

# Çalışma dizinini user-auth-service olarak değiştir
WORKDIR /app/services/user-auth-service

# User Auth Service servisini başlat
CMD ["npm", "run", "dev"]

# User Auth Service servisinin portunu dışarıya aç
EXPOSE 3003 