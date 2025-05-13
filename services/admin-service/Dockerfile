FROM node:18-alpine

WORKDIR /app

# Önce package.json dosyalarını kopyala ve bağımlılıkları yükle
COPY services/admin-service/package*.json ./services/admin-service/
COPY shared/package*.json ./shared/
COPY package*.json ./

# Root seviyesindeki bağımlılıkları yükle
RUN npm install

# Shared klasörünün bağımlılıklarını yükle
RUN cd shared && npm install

# Admin Service bağımlılıklarını yükle
RUN cd services/admin-service && npm install

# Şimdi tüm dosyaları kopyala
COPY shared ./shared
COPY services/admin-service ./services/admin-service

# Çalışma dizinini admin-service olarak değiştir
WORKDIR /app/services/admin-service

# Admin Service servisini başlat
CMD ["npm", "run", "dev"]

# Admin Service servisinin portunu dışarıya aç
EXPOSE 3002 