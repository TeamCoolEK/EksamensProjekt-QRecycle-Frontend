# Laver et image af en nginx server, som kopiere frontend mappen og conf, til brug i nginx serveren.
FROM nginx:alpine
# Kopiere nginx.conf filen ind i vores image
COPY nginx.conf
# Kopire API config til produktion (renamer til config.js)
COPY config.production.js /usr/share/nginx/html/config.js
# Kopire Utils til import af authFetch
COPY utils.js /usr/share/nginx/html/
#Kopiere hele frontend mappen til nginx
COPY index.html /usr/share/nginx/html/
COPY js/ /usr/share/nginx/html/js/
COPY css/ /usr/share/nginx/html/css/
COPY img/ /usr/share/nginx/html/img/

# Exposer serveren til port 80 så man kan tilgå den
# Vi åbner kun frontenden op til offentligheden (Reverse proxy)... port 8080 er reserveret til backend (privat)
EXPOSE 80

