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
