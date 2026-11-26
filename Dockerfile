# Container kecil untuk menyajikan kuis di /kuistes/
# Build: docker build -t kuistes .   Jalankan: docker run -p 8080:80 kuistes
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY kuistes/ /usr/share/nginx/html/kuistes/
EXPOSE 80
