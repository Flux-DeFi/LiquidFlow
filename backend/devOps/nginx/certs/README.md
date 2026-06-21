# nginx TLS certificates

The nginx service terminates TLS on port 443 (see `../nginx.conf`). The
`docker-compose.yml` and `docker-compose.nginx.yml` files mount this directory
read-only into the container at `/etc/nginx/certs`, and nginx reads:

- `fullchain.pem` — the full certificate chain (`ssl_certificate`)
- `privkey.pem`   — the private key (`ssl_certificate_key`)

## Providing certificates

This directory intentionally does **not** contain any certificate or key
material (those files are git-ignored). Provision real certificates separately
and place them here before starting nginx. **Provisioning of the actual
certificates (AWS ACM / Let's Encrypt) is out of scope** for the application
repo and is handled by the deployment infrastructure.

### Local development / testing

Generate a self-signed certificate for local use:

```sh
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout privkey.pem -out fullchain.pem \
  -days 365 -subj "/CN=localhost"
```

### Production

Place the production `fullchain.pem` and `privkey.pem` (from Let's Encrypt,
ACM-exported material, or your CA) in this directory, or override the
`../nginx/certs:/etc/nginx/certs:ro` bind mount to point at the host path where
your certificates live.
