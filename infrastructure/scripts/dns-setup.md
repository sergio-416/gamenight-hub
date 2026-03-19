# DNS Setup for gamenight-hub.com

VPS IP: 72.61.201.76

## Hostinger DNS Records

Add these records in the Hostinger DNS zone editor:

| Type | Name | Value           | TTL  |
| ---- | ---- | --------------- | ---- |
| A    | @    | 72.61.201.76    | 3600 |
| A    | www  | 72.61.201.76    | 3600 |
| AAAA | @    | (IPv6 if avail) | 3600 |

## GitHub Actions Secrets Required

Add these in: GitHub → Repository → Settings → Secrets → Actions

| Secret Name | Value                           |
| ----------- | ------------------------------- |
| VPS_HOST    | 72.61.201.76                    |
| VPS_USER    | gamenight (or root for initial) |
| VPS_SSH_KEY | Private SSH key for VPS access  |

## Verification

After DNS propagates (up to 24h):

```bash
dig gamenight-hub.com A
curl -I https://gamenight-hub.com/api/v1/health
```
