# ЛР3: Argo CD

- `01_installation/le-issuer.yml` — ClusterIssuer Let's Encrypt (cert-manager, HTTP-01 через ingress-nginx).
- `01_installation/ingress.yml` — Ingress для веб-інтерфейсу Argo CD на `argocd.kprojectgemfk.xyz`.
- `02_application/application.yml` — Application Argo CD для ч.2: чарт `helm/mini-task-manager` з цього репозиторію (ручна синхронізація). Чарт згодом перенесено, див. історію git.
- `03_automation/application.yml` — Application Argo CD для ч.3: чарт з [mini-task-manager-charts](https://github.com/SilentProg/mini-task-manager-charts), автоматична синхронізація.

CI: `.github/workflows/ci.yml` — тести → образ `silentprog/mini-task-manager:1.2.<N>` у Docker Hub → оновлення `image.tag` у репозиторії чарту.
