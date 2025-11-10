from flask import Blueprint, jsonify, request
from db import db
import models
from helpers.permissions import Roles, require_roles
from sqlalchemy import text

bp = Blueprint('database', __name__)

# Define Routes

@bp.route('/menu_items', methods=['GET'])
@require_roles(Roles.CUSTOMER, Roles.EMPLOYEE, Roles.MANAGER)
def get_items(uid):
    count = db.session.query(models.MenuItem).count()  # SQLAlchemy row count
    return jsonify({"menu_items_count": count})


@bp.route('/menu_items_by_category', methods=['GET'])
def menu_items_by_category():
    """Return non-modification menu items (drinks) for a given category.
    Query param: category=<string>
    Response: { items: [ {id, name, price, description, category} ] }
    """
    category = request.args.get('category')
    if not category:
        return jsonify({"error": "Missing category parameter"}), 400

    try:
        items = (
            db.session.query(models.MenuItem)
            .filter(models.MenuItem.category == category)
            .filter(models.MenuItem.is_modification == False)
            .order_by(models.MenuItem.name.asc())
            .all()
        )
        data = [
            {
                "id": m.id,
                "name": m.name,
                "price": float(m.price),
                "description": m.description,
                "category": m.category,
            }
            for m in items
        ]
        return jsonify({"items": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
