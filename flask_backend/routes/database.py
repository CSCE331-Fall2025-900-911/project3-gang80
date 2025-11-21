from flask import Blueprint, jsonify, request
from db import db
import models
from helpers.permissions import Roles, require_roles
from sqlalchemy import text
from datetime import datetime
from globals import ORG_ID, SUPERUSER_EMAILS
from flask_cors import cross_origin
from google.oauth2 import id_token
from google.auth.transport import requests


bp = Blueprint('database', __name__)

# Define Routes

@bp.route('/menu_items', methods=['GET'])
def get_items():
    """
    Return all menu items with full details:
    [
        {
            id,
            name,
            price,
            category,
            description,
            img_name
        },
        ...
    ]
    """
    try:
        items = db.session.query(models.MenuItem).all()
        data = []
        for item in items:
            data.append({
                "id": item.id,
                "name": item.name,
                "price": float(item.price),   # ensure JSON serializable
                "category": item.category,
                "description": item.description,
                "img_name": item.img_name
            })
        return jsonify({"items": data})
    except Exception as e:
        print("Error fetching menu items:", e)
        return jsonify({"error": "Failed to fetch menu items"}), 500



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
    

@bp.route('/menu_modifications', methods=['GET'])
def menu_modifications():
    """Return modification menu items grouped by category.

    Response format:
    {
        "categories": {
            "Ice Level": [ {id, name, price, description, category, img_name}, ... ],
            "Toppings": [ ... ],
            ...
        }
    }
    """
    try:
        items = (
            db.session.query(models.MenuItem)
            .filter(models.MenuItem.is_modification == True)
            .order_by(models.MenuItem.category.asc(), models.MenuItem.name.asc())
            .all()
        )

        grouped = {}
        for m in items:
            cat = m.category or "Uncategorized"
            grouped.setdefault(cat, []).append({
                "id": m.id,
                "name": m.name,
                "price": float(m.price) if m.price is not None else None,
                "description": m.description,
                "category": m.category,
                "img_name": m.img_name,
            })

        return jsonify({"categories": grouped}), 200
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
        orders = db.session.query(models.Order).order_by(models.Order.timestamp.desc()).all()

        data = [
            {
                "id": o.id,
                "customer_id": o.customer_id,
                "timestamp": o.timestamp.isoformat() if o.timestamp else None,
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


@bp.route('/login', methods=['POST', 'OPTIONS'])
#@cross_origin(origins=["http://localhost:5173", "https://project3-gang80-1.onrender.com"], supports_credentials=True)
def add_user():
    if request.method == "OPTIONS":
        return '', 200
    
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
        return jsonify({"user_id": user.id, "user_role":user.role, "message": "User already exists"})
    
    userRole = Roles.SUPERUSER if (idinfo.get("email") in SUPERUSER_EMAILS) else Roles.CUSTOMER

    user = models.User(uid=uid, role=userRole.value, name=idinfo.get("name"), email=idinfo.get("email"))
    db.session.add(user)
    db.session.commit()
    return jsonify({"user_id": user.id, "user_role":user.role, "message": "User added"})

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
            timestamp=datetime.utcnow(),  
        )
        
        db.session.add(new_order)
        db.session.flush()  # Get new_order.id before commit

        for item in data['items']:
            base_order_item = models.JointOrderItem(
                menu_item_id=item['menu_item_id'],
                order_id=new_order.id
            )
            db.session.add(base_order_item)

            base_ingredients = db.session.query(models.JointRecipeIngredient).filter_by(
                menu_item_id = item['menu_item_id']
            ).all()

            for ing in base_ingredients:
                inventory_item = db.session.query(models.Inventory).filter_by(
                    id = ing.inventory_item_id
                ).first()
                if inventory_item:
                    inventory_item.quantity -= ing.quantity_used
                    if inventory_item.quantity < 0:
                        inventory_item.quantity = 0
            
            for topping in item.get('toppings', []):
                topping_order_item = models.JointOrderItem(
                    menu_item_id = topping['id'],
                    order_id = new_order.id
                )
                db.session.add(topping_order_item)

                topping_ingredients = db.session.query(models.JointRecipeIngredient).filter_by(
                    menu_item_id = topping['id']
                ).all()
                for ing in topping_ingredients:
                    inventory_item = db.session.query(models.Inventory).filter_by(
                        id = ing.inventory_item_id
                    ).first()
                    if inventory_item:
                        inventory_item.quantity -= ing.quantity_used
                        if inventory_item.quantity < 0:
                            inventory_item.quantity = 0

        db.session.commit()

        return jsonify({
            "order_id": new_order.id,
            "timestamp": new_order.timestamp.isoformat(),
            "message": "Order created successfully"
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
@bp.route('/users/create', methods=['POST'])
def create_user():
    data = request.get_json()
    try:
        new_user = models.User(
            uid=data['uid'],
            name=data.get('name'),
            email=data.get('email'),
            role=data['role'],
            phone_number=data.get('phone_number'),
            rewards=data.get('rewards', 0)
        )
        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "id": new_user.id,
            "message": "User created successfully"
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@bp.route('/users/<int:user_id>/delete', methods=['DELETE'])
@cross_origin(origins=["http://localhost:5173", "https://project3-gang80-1.onrender.com"], supports_credentials=True)
def delete_user(user_id):
    user = db.session.query(models.User).filter_by(id=user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully"}), 200
    
@bp.route('/users', methods=['GET'])
def get_users():
    """
    Return all users in the system.
    Response format:
    {
        "users": [
            { id, uid, name, email, role, phone_number, rewards }
        ]
    }
    """
    try:
        users = db.session.query(models.User).all()

        data = [
            {
                "id": u.id,
                "uid": u.uid,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "phone_number": u.phone_number,
                "rewards": u.rewards
            }
            for u in users
        ]

        return jsonify({"users": data}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

