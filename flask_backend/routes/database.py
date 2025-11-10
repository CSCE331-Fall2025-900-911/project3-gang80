from flask import Blueprint, jsonify, request
from db import db
import models
from helpers.permissions import Roles, require_roles

bp = Blueprint('database', __name__)

# Define Routes

@bp.route('/menu_items', methods=['GET'])
@require_roles(Roles.CUSTOMER, Roles.EMPLOYEE, Roles.MANAGER)
def get_items(uid):
    count = db.session.query(models.MenuItem).count()  # SQLAlchemy row count
    return jsonify({"menu_items_count": count})

ORG_ID = "1090847452683-mc60dh5mdhlj90i1qathlqovdc3bhj2d.apps.googleusercontent.com"

@bp.route('/add_user', methods=['POST'])
def add_user():
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return jsonify({"error": "Missing Authorization header"}), 401
    token = auth.split(" ", 1)[1]

    try:
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), ORG_ID)
    except ValueError:
        return jsonify({"error": "Invalid token"}), 401

    uid = idinfo.get("sub")
    if not uid:
        return jsonify({"error": "Token missing 'sub'"}), 400

    user = db.session.query(models.User).filter(models.User.uid == uid).first()
    if user:
        return jsonify({"user_id": user.id, "message": "User already exists"})

    user = models.User(uid=uid, role=Roles.CUSTOMER, name=idinfo.get("name"), email=idinfo.get("email"))
    db.session.add(user)
    db.session.commit()
    return jsonify({"user_id": user.id, "message": "User added"})