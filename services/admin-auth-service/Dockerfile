FROM node:18-alpine

WORKDIR /app

# Önce package.json dosyalarını kopyala ve bağımlılıkları yükle
COPY services/admin-auth-service/package*.json ./services/admin-auth-service/
COPY shared/package*.json ./shared/
COPY package*.json ./

# Root seviyesindeki bağımlılıkları yükle
RUN npm install

# Shared klasörünün bağımlılıklarını yükle
RUN cd shared && npm install

# Admin Auth Service bağımlılıklarını yükle
RUN cd services/admin-auth-service && npm install

# Şimdi tüm dosyaları kopyala
COPY shared ./shared
COPY services/admin-auth-service ./services/admin-auth-service

# Çalışma dizinini admin-auth-service olarak değiştir
WORKDIR /app/services/admin-auth-service

# Admin Auth Service servisini başlat
CMD ["npm", "run", "dev"]

# Admin Auth Service servisinin portunu dışarıya aç
EXPOSE 3001 