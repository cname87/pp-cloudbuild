# Create an image wth nginx to act as a reverse proxy and serve static files.

# Use latest stable nginx image from Docker hub
FROM nginx:latest


WORKDIR /

# Copy the nginx server configuration
COPY ./nginx-server.conf /etc/nginx/templates/default.conf.template

# Copy the files to be served by the nginx reverse proxy
COPY ./dist /usr/share/www/

# Run a bash script that calls envsubst to swap the environment variable 'service' in the file /etc/nginx/templates/default.conf.template and write the output to the file /etc/nginx/conf.d/default.conf, and then run nginx in the foreground
# NOTE: The environment variable is set in the deployment yaml file
ENTRYPOINT [ \
"/bin/bash", "-c", \
"envsubst '${service}' \
< /etc/nginx/templates/default.conf.template \
> /etc/nginx/conf.d/default.conf \
&& nginx -g 'daemon off;'"]


