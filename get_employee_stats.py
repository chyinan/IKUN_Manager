import requests
import json

try:
    # Add Authorization header
    headers = {
        'Authorization': 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTc0OTgzNDUxNSwiZXhwIjoxNzQ5OTIwOTE1fQ.lQC5ZzYC5ZFoYkNiJbAZu5eVl3GD5mKGhB9Eo0t5KS_vHZhZNnzCPYHeg-vVE22nQFcjn-UVHarG-m-ND2S2pA' # 使用完整的Token
    }
    response = requests.get('http://localhost:8081/api/employee/stats', headers=headers)
    response.raise_for_status()  # Raises an HTTPError for bad responses (4xx or 5xx)
    json_response = response.json()
    print("API Response (JSON):")
    print(json.dumps(json_response, indent=2))
except requests.exceptions.RequestException as e:
    print(f'Error making request: {e}')
    if 'response' in locals():
        print(f'HTTP Status Code: {response.status_code}')
        print(f'Response Content: {response.text}')
except json.JSONDecodeError as e:
    print(f'Error decoding JSON: {e}')
    if 'response' in locals():
        print(f'HTTP Status Code: {response.status_code}')
        print(f'Response Content: {response.text}')
except Exception as e:
    print(f'An unexpected error occurred: {e}') 