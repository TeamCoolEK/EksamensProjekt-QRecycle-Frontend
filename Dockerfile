# Laver et image af en nginx server, som kopiere frontend mappen og conf, til brug i nginx serveren.
FROM nginx:alpine
# Kopiere nginx.conf filen ind i vores image
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Kopire API config til produktion
COPY config.production.js /usr/share/nginx/html/config.js
#Kopiere hele frontend mappen til nginx
COPY index.html /usr/share/nginx/html/
COPY js/ /usr/share/nginx/html/js/
COPY css/ /usr/share/nginx/html/css/

# starter entrypoint.sh og tilføjer google api fra github secrets
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Exposer serveren til port 80 så man kan tilgå den
# Vi åbner kun frontenden op til offentligheden (Reverse proxy)... port 8080 er reserveret til backend (privat)
EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]