# Site statique + relais vers les API météo, servi par Nginx sans privilèges root (port 8080).
# Clés à fournir au conteneur : OWM_API_KEY et OPENCAGE_API_KEY.
FROM nginxinc/nginx-unprivileged:1.27-alpine

# Au démarrage, l'image remplace ${OWM_API_KEY}/${OPENCAGE_API_KEY} dans le modèle et écrit
# le résultat dans /tmp (le reste du système de fichiers est en lecture seule en production).
ENV NGINX_ENVSUBST_OUTPUT_DIR=/tmp \
    NGINX_ENVSUBST_FILTER="^(OWM|OPENCAGE)_API_KEY$"

COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/security-headers.conf /etc/nginx/security-headers.conf
COPY . /usr/share/nginx/html

USER root
RUN echo "include /tmp/*.conf;" > /etc/nginx/conf.d/default.conf \
    && rm -rf /usr/share/nginx/html/docker /usr/share/nginx/html/Dockerfile
USER 101

EXPOSE 8080
