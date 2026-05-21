#!/bin/sh
cat > /usr/share/nginx/html/config.secrets.js <<EOF
export const MAPS_API_KEY = "${GOOGLE_API_KEY}";
EOF

exec nginx -g 'daemon off;'