# Gateway Dockerfile

# Node.js temel imajını kullan
FROM node:18-alpine

# Çalışma dizinini belirle
WORKDIR /usr/src/app

# Önce package.json ve package-lock.json dosyalarını kopyala
COPY ./gateway/package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Shared klasörünü kopyala (logger için)
COPY ./shared /usr/src/shared

# Gateway kodlarını kopyala
COPY ./gateway .

# Sağlık kontrolü
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Port 8080'i dışa aç
EXPOSE 8080

# Uygulamayı başlat
CMD ["node", "index.js"] 