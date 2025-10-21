# AGH-SCS-DDoS

Rember to generate keys before running docker

```
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -keyout key.pem -out certificate.pem -days 365 --env ./openssl.cnf
``` 

to run containerized version of this demo run

```
docker-compose up
```