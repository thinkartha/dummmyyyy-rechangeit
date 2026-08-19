# Frontend ↔ backend integration

Use this folder for API clients, auth helpers, and contracts that the Phoenix
UI calls. Lambda lives in `../backend`; ETL jobs live in `../middleware`.

- `api-client.js` — fetch wrapper aimed at API Gateway
- Set `window.__API_BASE_URL__` (or edit the constant) to your deployed API URL
