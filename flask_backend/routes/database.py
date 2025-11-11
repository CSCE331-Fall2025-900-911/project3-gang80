from flask import Blueprint, jsonify, request
from db import db
import models
from helpers.permissions import Roles, require_roles
from sqlalchemy import text
from datetime import datetime

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
                "img_name": m.img_name,
            }
            for m in items
        ]
        return jsonify({"items": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@bp.route('/orders', methods=['GET'])
def get_all_orders():
    """
    Return all orders from the orders table.
    Response format:
    {
        orders: [
            {
                id,
                customer_id,
                timestamp,
                total_price,
                pearls_earned,
                employee_id,
                payment_method
            },
            ...
        ]
    }
    """
    try:
        orders = db.session.query(models.Order).all()
        data = [
            {
                "id": o.id,
                "customer_id": o.customer_id,
                # "timestamp": o.timestamp.isoformat() if o.timestamp else None,
                "total_price": float(o.total_price) if o.total_price else None,
                "pearls_earned": o.pearls_earned,
                "employee_id": o.employee_id,
                "payment_method": o.payment_method
            }
            for o in orders
        ]
        return jsonify({"orders": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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

@bp.route('/orders/create', methods=['POST', 'OPTIONS'])
def create_order():
    # Handle CORS preflight requests
    if request.method == "OPTIONS":
        return '', 200

    data = request.get_json()
    try:
        new_order = models.Order(
            customer_id=data.get('customer_id'),
            total_price=data['total_price'],
            pearls_earned=data['pearls_earned'],
            employee_id=data.get('employee_id'),
            payment_method=data['payment_method'],
            timestamp=datetime.utcnow(),  # ✅ timestamp from backend
        )

        for item in data['items']:
            order_item = models.OrderItem(
                menu_item_id=item['menu_item_id'],
                quantity=item['quantity'],
            )
            new_order.items.append(order_item)

        db.session.add(new_order)
        db.session.commit()

        return jsonify({
            "order_id": new_order.id,
            "timestamp": new_order.timestamp.isoformat(),
            "message": "Order created successfully"
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
