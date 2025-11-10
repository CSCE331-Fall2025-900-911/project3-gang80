from enum import Enum
from flask import request, jsonify
from functools import wraps
from helpers.queries import get_user

from google.oauth2 import id_token
from google.auth.transport import requests

# To verify token audience is our organization, fill in once we actually have one.
ORG_ID = "1090847452683-mc60dh5mdhlj90i1qathlqovdc3bhj2d.apps.googleusercontent.com"

class Roles(Enum):
    CUSTOMER = 0
    EMPLOYEE = 1
    MANAGER = 2
    SUPERUSER = 3


def require_roles(*roles_permitted):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs): # 401 = Failed Authentication, 403 = Failed Authorization

            # Extract Token from Header
            auth = request.headers.get("Authorization")
            if not auth or not auth.startswith("Bearer "):
                return jsonify({"error": "Missing Authorization header"}), 401
            token = auth.split(" ", 1)[1]

            # Check Token Validity and Parse
            try:
                idinfo = id_token.verify_oauth2_token(token, requests.Request(), ORG_ID)
            except Exception:
                return jsonify({"error": "Invalid token"}), 401
            
            # Get user
            user = get_user(idinfo["sub"])
            if not user:
                return jsonify({"error": "User Does Not Exist"}), 401

            # Authorization Check
            role = user.role
            if role not in roles_permitted:
                return jsonify({"error": "Forbidden"}), 403

            # Continue to Handler
            uid = user.uid
            return f(uid, *args, **kwargs)
        return wrapper
    return decorator



def has_permission(uid, *allowed_roles):
    user_role = get_user(uid).role
    if user_role == Roles.SUPERUSER:
        return True
    else:
        return user_role in allowed_roles