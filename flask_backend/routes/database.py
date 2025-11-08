from flask import Blueprint, jsonify
from db import db
import models
from helpers.permissions import Roles, has_permission

bp = Blueprint('database', __name__)

# Define Routes

@bp.route('/menu_items', methods=['GET'])
def get_items():
    if not has_permission("TokenHere", Roles.MANAGER, Roles.EMPLOYEE):
        return "error" # 401 is failure to authenticate, 403 is no authorization, how to send it out though?
    count = db.session.query(models.MenuItem).count()  # SQLAlchemy row count
    return jsonify({"menu_items_count": count})
