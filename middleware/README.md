# Middleware — ETL / ELT pipelines

Place batch/sync jobs here (extract → transform → load). These can later run on
Lambda, Step Functions, ECS, or Glue.

```bash
cd middleware
pip install -r requirements.txt
PYTHONPATH=. python -m pipelines.example_pipeline
```
