from flask import Blueprint, jsonify, request, current_app
from db import db
import models
from helpers.permissions import Roles, require_roles
from sqlalchemy import text
from datetime import datetime
from decimal import Decimal
from globals import ORG_ID, SUPERUSER_EMAILS, TRANSLATE_API_KEY
from flask_cors import cross_origin
from google.oauth2 import id_token
from google.auth.transport import requests
import requests as http_requests
import os


bp = Blueprint('database', __name__)

# Define Routes

@bp.route('/menu_items', methods=['GET'])
#@require_roles(Roles.UNVERIFIED)
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
#@require_roles(Roles.CUSTOMER, Roles.EMPLOYEE, Roles.MANAGER, Roles.KIOSK)
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
#@require_roles(Roles.UNVERIFIED)
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


@bp.route('/menu_items_all', methods=['GET'])
#@require_roles(Roles.UNVERIFIED)
def menu_items_all():
    """Return all non-modification menu items (drinks), sorted by category and name."""
    try:
        items = (
            db.session.query(models.MenuItem)
            .filter(models.MenuItem.is_modification == False)
            .order_by(models.MenuItem.category.asc(), models.MenuItem.name.asc())
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


@bp.route('/menu_items/create', methods=['POST'])
#@require_roles(Roles.MANAGER)
def create_menu_item():
    """Create a new non-modification menu item (drink).
    Expected JSON body:
    {
        "name": string,            (required, unique case-insensitive)
        "price": number|string,    (required, > 0)
        "category": string,        (required)
        "description": string|null (optional)
        "img_name": string|null    (optional)
        "is_modification": bool    (optional, default false)
    }
    """
    data = request.get_json(silent=True) or {}

    name = (data.get('name') or '').strip()
    price_raw = data.get('price')
    category = (data.get('category') or '').strip()
    description = (data.get('description') or None)
    img_name = (data.get('img_name') or None)
    is_modification = bool(data.get('is_modification', False))

    # Basic validation
    if not name:
        return jsonify({"error": "'name' is required"}), 400
    if not category:
        return jsonify({"error": "'category' is required"}), 400
    if price_raw is None:
        return jsonify({"error": "'price' is required"}), 400
    try:
        price_val = Decimal(str(price_raw))
    except Exception:
        return jsonify({"error": "'price' must be numeric"}), 400
    if price_val <= 0:
        return jsonify({"error": "'price' must be > 0"}), 400

    # Uniqueness check (case-insensitive)
    existing = db.session.query(models.MenuItem).filter(models.MenuItem.name.ilike(name)).first()
    if existing:
        return jsonify({"error": "Menu item with that name already exists", "id": existing.id}), 409

    try:
        item = models.MenuItem(
            name=name,
            price=price_val,
            category=category,
            description=description,
            img_name=img_name,
            is_modification=is_modification,
        )
        db.session.add(item)
        db.session.commit()
        return jsonify({
            "id": item.id,
            "name": item.name,
            "price": float(item.price),
            "category": item.category,
            "description": item.description,
            "img_name": item.img_name,
            "is_modification": item.is_modification,
            "message": "Menu item created"
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@bp.route('/menu_items/<int:item_id>/update', methods=['PATCH', 'POST'])
#@require_roles(Roles.MANAGER)
def update_menu_item( item_id):
    """Update an existing menu item.
    Accepts partial fields.
    Body may include any of:
    {
        "name": string (unique case-insensitive),
        "price": number|string (>0),
        "category": string,
        "description": string|null,
        "img_name": string|null,
        "is_modification": bool
    }
    """
    data = request.get_json(silent=True) or {}

    item = db.session.query(models.MenuItem).filter_by(id=item_id).first()
    if not item:
        return jsonify({"error": "Menu item not found"}), 404

    # Handle name uniqueness
    if 'name' in data and data['name'] is not None:
        new_name = str(data['name']).strip()
        if not new_name:
            return jsonify({"error": "'name' cannot be empty"}), 400
        existing = db.session.query(models.MenuItem).filter(models.MenuItem.name.ilike(new_name)).filter(models.MenuItem.id != item_id).first()
        if existing:
            return jsonify({"error": "Another item with that name exists", "conflict_id": existing.id}), 409
        item.name = new_name

    # Price
    if 'price' in data and data['price'] is not None:
        try:
            new_price = Decimal(str(data['price']))
        except Exception:
            return jsonify({"error": "'price' must be numeric"}), 400
        if new_price <= 0:
            return jsonify({"error": "'price' must be > 0"}), 400
        item.price = new_price

    # Category
    if 'category' in data and data['category'] is not None:
        new_cat = str(data['category']).strip()
        if not new_cat:
            return jsonify({"error": "'category' cannot be empty"}), 400
        item.category = new_cat

    # Description (allow null / blank)
    if 'description' in data:
        desc = data['description']
        item.description = (desc.strip() if isinstance(desc, str) and desc.strip() else None)

    # Image name
    if 'img_name' in data:
        img = data['img_name']
        item.img_name = (img.strip() if isinstance(img, str) and img.strip() else None)

    # is_modification
    if 'is_modification' in data:
        item.is_modification = bool(data['is_modification'])

    try:
        db.session.commit()
        return jsonify({
            "id": item.id,
            "name": item.name,
            "price": float(item.price),
            "category": item.category,
            "description": item.description,
            "img_name": item.img_name,
            "is_modification": item.is_modification,
            "message": "Menu item updated"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    

@bp.route('/menu_items/<int:item_id>/delete', methods=['DELETE'])
#@require_roles(Roles.MANAGER)
def delete_menu_item(item_id):
    """Hard delete a menu item and any orders containing it.
    Steps:
      1. Delete recipe ingredient rows for this menu item.
      2. Find all orders having at least one JointOrderItem referencing this menu item.
      3. Delete ALL JointOrderItems belonging to those orders.
      4. Delete those orders.
      5. Delete remaining JointOrderItems referencing the menu item (if any).
      6. Delete the menu item itself.
    Returns counts of affected orders and order items.
    WARNING: This permanently removes historical order data.
    """
    item = db.session.query(models.MenuItem).filter_by(id=item_id).first()
    if not item:
        return jsonify({"error": "Menu item not found"}), 404
    try:
        # 1. Delete recipe ingredient rows
        recipe_deleted = db.session.query(models.JointRecipeIngredient).filter_by(menu_item_id=item_id).delete()

        # 2. Find all orders containing this menu item
        order_ids = [row.order_id for row in db.session.query(models.JointOrderItem.order_id).filter_by(menu_item_id=item_id).all()]

        orders_deleted = 0
        order_items_deleted = 0
        if order_ids:
            # 3. Delete all joint order items for those orders
            order_items_deleted += db.session.query(models.JointOrderItem).filter(models.JointOrderItem.order_id.in_(order_ids)).delete(synchronize_session=False)
            # 4. Delete the orders themselves
            orders_deleted += db.session.query(models.Order).filter(models.Order.id.in_(order_ids)).delete(synchronize_session=False)

        # 5. Delete any remaining joint order items referencing this menu item (if not covered above)
        remaining_items_deleted = db.session.query(models.JointOrderItem).filter_by(menu_item_id=item_id).delete()
        order_items_deleted += remaining_items_deleted

        # 6. Delete the menu item
        db.session.delete(item)

        # Reset sequences so next inserts continue sequentially from current max(id)
        # This does NOT fill gaps; only ensures nextval >= MAX(id)+1 if sequence got ahead/behind.
        try:
            db.session.flush()  # apply deletions before recalculating max values
            # menu_items sequence reset
            db.session.execute(text("SELECT setval(pg_get_serial_sequence('menu_items','id'), COALESCE((SELECT MAX(id) FROM menu_items), 0))"))
            menu_seq_warning = None
        except Exception as seq_err:
            menu_seq_warning = str(seq_err)

        try:
            # orders sequence reset (only needed if orders were deleted, but safe always)
            db.session.execute(text("SELECT setval(pg_get_serial_sequence('orders','id'), COALESCE((SELECT MAX(id) FROM orders), 0))"))
            orders_seq_warning = None
        except Exception as seq2_err:
            orders_seq_warning = str(seq2_err)

        db.session.commit()
        return jsonify({
            "id": item_id,
            "message": "Menu item and related orders deleted",
            "orders_deleted": orders_deleted,
            "order_items_deleted": order_items_deleted,
            "recipe_rows_deleted": recipe_deleted,
            "menu_sequence_reset": menu_seq_warning is None,
            "menu_sequence_warning": menu_seq_warning,
            "orders_sequence_reset": orders_seq_warning is None,
            "orders_sequence_warning": orders_seq_warning
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@bp.route('/menu_items/<int:item_id>/recipe/set', methods=['POST'])
#@require_roles(Roles.MANAGER)
def set_menu_item_recipe(item_id):
    """Define (replace) the recipe ingredients for a menu item.
    Expected body:
    {
      "ingredients": [ { "inventory_item_id": int, "quantity_used": int }, ... ]
    }
    All existing recipe rows for this menu item will be deleted then replaced.
    """
    data = request.get_json(silent=True) or {}
    ingredients = data.get('ingredients')
    if ingredients is None or not isinstance(ingredients, list):
        return jsonify({"error": "'ingredients' must be an array"}), 400

    item = db.session.query(models.MenuItem).filter_by(id=item_id).first()
    if not item:
        return jsonify({"error": "Menu item not found"}), 404

    try:
        # Remove existing recipe rows
        db.session.query(models.JointRecipeIngredient).filter_by(menu_item_id=item_id).delete()

        # Validate and insert new rows
        inserted = []
        for ing in ingredients:
            inv_id = ing.get('inventory_item_id')
            qty = ing.get('quantity_used')
            if inv_id is None or qty is None:
                return jsonify({"error": "Each ingredient needs inventory_item_id and quantity_used"}), 400
            try:
                inv_id = int(inv_id)
                qty = int(qty)
            except ValueError:
                return jsonify({"error": "inventory_item_id and quantity_used must be integers"}), 400
            if qty <= 0:
                return jsonify({"error": "quantity_used must be > 0"}), 400

            # Optional: verify inventory item exists
            inv = db.session.query(models.Inventory).filter_by(id=inv_id).first()
            if not inv:
                return jsonify({"error": f"Inventory item {inv_id} not found"}), 404

            row = models.JointRecipeIngredient(
                menu_item_id=item_id,
                inventory_item_id=inv_id,
                quantity_used=qty
            )
            db.session.add(row)
            inserted.append({"inventory_item_id": inv_id, "quantity_used": qty})

        db.session.commit()
        return jsonify({
            "menu_item_id": item_id,
            "ingredients": inserted,
            "message": "Recipe set"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    

@bp.route('/inventory', methods=['GET'])
#@require_roles(Roles.EMPLOYEE, Roles.MANAGER)
def get_inventory():
    """Return all inventory items.

    Response format:
    {
      "inventory": [ { id, name, quantity, restock_price }, ... ]
    }
    """
    try:
        items = db.session.query(models.Inventory).order_by(models.Inventory.name.asc()).all()
        data = [
            {
                "id": i.id,
                "name": i.name,
                "quantity": i.quantity,
                "restock_price": float(i.restock_price) if i.restock_price is not None else None,
            }
            for i in items
        ]
        return jsonify({"inventory": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/inventory/item', methods=['GET'])
#@require_roles(Roles.EMPLOYEE, Roles.MANAGER)
def get_inventory_item():
    """Return a single inventory item by id or name.

    Query params: ?id=<int> or ?name=<string>
    Response: { id, name, quantity, restock_price }
    """
    item_id = request.args.get('id')
    name = request.args.get('name')
    if not item_id and not name:
        return jsonify({"error": "Provide id or name parameter"}), 400

    try:
        query = db.session.query(models.Inventory)
        if item_id:
            query = query.filter(models.Inventory.id == int(item_id))
        else:
            # case-insensitive match
            query = query.filter(models.Inventory.name.ilike(name))

        item = query.first()
        if not item:
            return jsonify({"error": "Item not found"}), 404

        data = {
            "id": item.id,
            "name": item.name,
            "quantity": item.quantity,
            "restock_price": float(item.restock_price) if item.restock_price is not None else None,
        }
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/inventory/order', methods=['POST', 'OPTIONS'])
#@require_roles(Roles.MANAGER)
def submit_inventory_order():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 200

    data = request.get_json() or {}
    items = data.get('items')
    if not items or not isinstance(items, list):
        return jsonify({"error": "Provide an 'items' array in the request body"}), 400

    try:
        updated = []
        for it in items:
            inv = None
            inv_id = it.get('inventory_id') or it.get('id')
            name = it.get('name')
            if inv_id is not None:
                inv = db.session.query(models.Inventory).filter(models.Inventory.id == int(inv_id)).first()
            elif name:
                inv = db.session.query(models.Inventory).filter(models.Inventory.name.ilike(name)).first()

            # If the inventory item does not exist, create it (simple behavior)
            if not inv:
                inv = models.Inventory(
                    name = name or f"item_{int(db.session.query(models.Inventory).count())+1}",
                    quantity = 0,
                    restock_price = it.get('price', 0.0)
                )
                db.session.add(inv)
                db.session.flush()

            # Interpret submitted quantity as restock (increase inventory)
            qty = int(it.get('quantity', 0))
            inv.quantity = (inv.quantity or 0) + qty

            # Optionally update restock price if provided
            if 'price' in it and it.get('price') is not None:
                inv.restock_price = it.get('price')

            updated.append({
                "id": inv.id,
                "name": inv.name,
                "quantity": inv.quantity,
                "restock_price": float(inv.restock_price) if inv.restock_price is not None else None,
            })

        db.session.commit()
        return jsonify({"updated": updated, "message": "Inventory updated"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@bp.route('/inventory/create', methods=['POST', 'OPTIONS'])
#@require_roles(Roles.MANAGER)
def create_inventory_item():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 200

    data = request.get_json() or {}
    name = data.get('name')
    quantity = data.get('quantity', 0)
    restock_price = data.get('restock_price', None)

    if not name:
        return jsonify({"error": "Missing 'name' in request body"}), 400

    try:
        # If item exists, return conflict
        existing = db.session.query(models.Inventory).filter(models.Inventory.name.ilike(name)).first()
        if existing:
            return jsonify({"error": "Item already exists", "id": existing.id}), 409

        new_item = models.Inventory(
            name=name,
            quantity=int(quantity),
            restock_price=restock_price,
        )
        db.session.add(new_item)
        db.session.commit()

        return jsonify({
            "id": new_item.id,
            "name": new_item.name,
            "quantity": new_item.quantity,
            "restock_price": float(new_item.restock_price) if new_item.restock_price is not None else None,
            "message": "Inventory item created"
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@bp.route('/translate', methods=['POST', 'OPTIONS'])
#@require_roles(Roles.UNVERIFIED)
def translate_text():
    # Proxy translation requests to Google Cloud Translation API (v2)
    if request.method == 'OPTIONS':
        return '', 200

    body = request.get_json() or {}
    q = body.get('q')
    target = body.get('target', 'en')
    if not q:
        return jsonify({"error": "Missing 'q' (text) in request body"}), 400

    api_key = TRANSLATE_API_KEY
    if not api_key:
        return jsonify({"error": "Translation API key not configured on server"}), 500

    url = 'https://translation.googleapis.com/language/translate/v2'
    payload = {
        'q': q,
        'target': target,
        'format': 'text'
    }
    params = {'key': api_key}

    try:
        resp = http_requests.post(url, params=params, json=payload, timeout=10)
        resp.raise_for_status()
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        current_app.logger.error('Translate request failed: %s', e)
        return jsonify({"error": "Translation request failed", "details": str(e)}), 502
    
@bp.route('/orders', methods=['GET'])
#@require_roles(Roles.MANAGER)
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
                payment_method,
                voided
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
                "payment_method": o.payment_method,
                "voided": o.voided or False
            }
            for o in orders
        ]
        return jsonify({"orders": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/orders/<int:order_id>/void', methods=['POST', 'OPTIONS'])
def void_order(order_id):
    """
    Mark an order as voided.
    
    Expected body (optional):
    {
        "reason": "string" (optional, for logging purposes)
    }
    
    Response:
    {
        "id": order_id,
        "voided": true,
        "message": "Order voided successfully"
    }
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        order = db.session.query(models.Order).filter_by(id=order_id).first()
        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        order.voided = True
        db.session.commit()
        
        return jsonify({
            "id": order.id,
            "voided": True,
            "message": "Order voided successfully"
        }), 200
    except Exception as e:
        db.session.rollback()
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
#@require_roles(Roles.CUSTOMER, Roles.KIOSK, Roles.EMPLOYEE, Roles.MANAGER)
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
            # Respect quantity: add the same menu_item to the order 'qty' times
            try:
                qty = int(item.get('quantity', 1) or 1)
            except Exception:
                qty = 1
            if qty < 1:
                qty = 1

            menu_item_id = item.get('menu_item_id')

            # Add base item rows repeated by quantity
            for _ in range(qty):
                base_order_item = models.JointOrderItem(
                    menu_item_id=menu_item_id,
                    order_id=new_order.id
                )
                db.session.add(base_order_item)

            # Deduct inventory for base ingredients multiplied by quantity
            base_ingredients = db.session.query(models.JointRecipeIngredient).filter_by(
                menu_item_id=menu_item_id
            ).all()

            for ing in base_ingredients:
                inventory_item = db.session.query(models.Inventory).filter_by(
                    id=ing.inventory_item_id
                ).first()
                if inventory_item:
                    inventory_item.quantity -= (ing.quantity_used * qty)
                    if inventory_item.quantity < 0:
                        inventory_item.quantity = 0

            # Handle toppings: add each topping qty times and deduct their ingredients accordingly
            for topping in item.get('toppings', []):
                topping_id = topping.get('id')
                for _ in range(qty):
                    topping_order_item = models.JointOrderItem(
                        menu_item_id=topping_id,
                        order_id=new_order.id
                    )
                    db.session.add(topping_order_item)

                topping_ingredients = db.session.query(models.JointRecipeIngredient).filter_by(
                    menu_item_id=topping_id
                ).all()
                for ing in topping_ingredients:
                    inventory_item = db.session.query(models.Inventory).filter_by(
                        id=ing.inventory_item_id
                    ).first()
                    if inventory_item:
                        inventory_item.quantity -= (ing.quantity_used * qty)
                        if inventory_item.quantity < 0:
                            inventory_item.quantity = 0

        # If the frontend indicated pearls were redeemed for this order, deduct them from the customer's account
        pearls_redeemed = data.get('pearls_redeemed')
        customer_id = data.get('customer_id')
        if pearls_redeemed and customer_id:
            try:
                user = db.session.query(models.User).filter_by(id=customer_id).first()
                if user is None:
                    db.session.rollback()
                    return jsonify({"error": "Customer not found for pearls deduction"}), 400
                # ensure numeric
                user_rewards = int(user.rewards or 0)
                redeem_amount = int(pearls_redeemed)
                if user_rewards < redeem_amount:
                    db.session.rollback()
                    return jsonify({"error": "Insufficient pearls on account"}), 400
                user.rewards = user_rewards - redeem_amount
            except Exception as e:
                db.session.rollback()
                return jsonify({"error": f"Failed to deduct pearls: {str(e)}"}), 500

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
#@require_roles(Roles.MANAGER)
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
#@require_roles(Roles.MANAGER)
@cross_origin(origins=["http://localhost:5173", "https://project3-gang80-1.onrender.com"], supports_credentials=True)
def delete_user(user_id):
    user = db.session.query(models.User).filter_by(id=user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully"}), 200
    
@bp.route('/users', methods=['GET'])
#@require_roles(Roles.EMPLOYEE, Roles.MANAGER)
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

@bp.route('/analytics/summary', methods=['GET'])
#@require_roles(Roles.MANAGER)
def analytics_summary():
    """
    Returns:
    {
       total_sales: float,
       total_expenses: float,
       profit: float,
       num_orders: int
    }
    """
    try:
        # ---- 1. Load all orders ----
        orders = db.session.query(models.Order).all()

        total_sales = sum(float(o.total_price) for o in orders)
        num_orders = len(orders)

        # ---- 2. Compute expenses from recipes/inventory ----
        # Join:
        #   JointOrderItem —> which menu items
        #   JointRecipeIngredient —> what ingredients each menu item uses
        #   Inventory —> cost of ingredient
        from sqlalchemy import func

        expenses_query = (
            db.session.query(
                func.sum(
                    models.JointRecipeIngredient.quantity_used *
                    models.Inventory.restock_price
                )
            )
            .join(models.JointOrderItem,
                models.JointRecipeIngredient.menu_item_id == models.JointOrderItem.menu_item_id)
            .join(models.Inventory,
                models.JointRecipeIngredient.inventory_item_id == models.Inventory.id)
        ).scalar()

        total_expenses = float(expenses_query or 0.0)

        profit = total_sales - total_expenses

        return jsonify({
            "total_sales": total_sales,
            "total_expenses": total_expenses,
            "profit": profit,
            "num_orders": num_orders
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

