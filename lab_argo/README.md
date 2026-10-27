# ЛР3: Argo CD

- `01_installation/le-issuer.yml` — ClusterIssuer Let's Encrypt (cert-manager, HTTP-01 через ingress-nginx).
- `01_installation/ingress.yml` — Ingress для веб-інтерфейсу Argo CD на `argocd.kprojectgemfk.xyz`.
- `02_application/application.yml` — Application Argo CD, що розгортає Helm-чарт `helm/mini-task-manager` з цього репозиторію (ручна синхронізація).

Чарт застосунку: `helm/mini-task-manager` (застосунок + MySQL, Ingress `mtm.kprojectgemfk.xyz` з сертифікатом Let's Encrypt).
