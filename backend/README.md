# Local invoke helpers (optional)
# Example with AWS SAM once installed:
#   sam local invoke HealthFunction -e events/health.json
#
# Or plain Python:
#   PYTHONPATH=. python -c "from handlers.health import handler; print(handler({}, type('C', (), {'aws_request_id':'local'})()))"
