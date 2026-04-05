
import requests
import json

BASE_URL = "http://localhost:5000"

def test_backend():
    print("--- Testing Home ---")
    r = requests.get(f"{BASE_URL}/")
    print(r.json())

    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
        "hobbies": ["testing"]
    }

    print("\n--- Testing Registration ---")
    r = requests.post(f"{BASE_URL}/register", json=user_data)
    print(r.json())

    print("\n--- Testing Login ---")
    login_data = {
        "email": "test@example.com",
        "password": "password123"
    }
    r = requests.post(f"{BASE_URL}/login", json=login_data)
    print(r.json())

    print("\n--- Testing Get All Users ---")
    r = requests.get(f"{BASE_URL}/users")
    print(r.json())

if __name__ == "__main__":
    try:
        test_backend()
    except Exception as e:
        print(f"Error testing: {e}")
