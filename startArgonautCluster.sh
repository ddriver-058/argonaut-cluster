eval $(ssh-agent) # Needed for SSH_AUTH_SOCK to be populated
ssh-add ~/.ssh/id_rsa
ssh-add -l # Allows user to ensure the identity is being forwarded
docker compose up --build --force-recreate
