# Backend (FastAPI) — Basic Inference API

This is a minimal backend to serve model inference.

## What works right now

- TFT demand forecasting endpoint (loads your `tft_blood_demand_model.ckpt`).
- PatchGRU 14-day endpoint (loads your `patchgru_best_model_fixed.pt`).
- Health endpoint.

## Setup

From the repo root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

If you see `ModuleNotFoundError` for ML packages (e.g. `pytorch_forecasting`), it usually means `uvicorn` is being run from a different Python than your virtualenv. Using `python -m uvicorn ...` ensures the active interpreter is used.

Open:

- `GET http://127.0.0.1:8000/api/v1/health`
- `POST http://127.0.0.1:8000/api/v1/forecast/demand`
- `POST http://127.0.0.1:8000/api/v1/forecast/expiry`

Example requests:

```bash
curl -s -X POST http://127.0.0.1:8000/api/v1/forecast/demand \
	-H 'Content-Type: application/json' \
	-d '{"hospital_id":"H001","blood_group":"O+","historical_demand":[10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10],"end_date":"2026-04-01"}'

curl -s -X POST http://127.0.0.1:8000/api/v1/forecast/expiry \
	-H 'Content-Type: application/json' \
	-d '{"hospital_id":"H001","blood_group":"O+","historical_demand":[10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10],"historical_stock":[5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],"end_date":"2026-04-01"}'
```

## Environment variables (optional)

- `MODEL_DIR` — defaults to `backend/models`
- `TFT_MODEL_PATH` — defaults to `backend/models/tft/tft_blood_demand_model.ckpt`
- `DEVICE` — `cpu` (default) or `cuda`
- `CORS_ORIGINS` — `*` (default) or comma-separated list

Example:

```bash
export DEVICE=cpu
export CORS_ORIGINS=http://localhost:5173
```
