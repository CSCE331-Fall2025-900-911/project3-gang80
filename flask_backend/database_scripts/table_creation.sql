CREATE TABLE users (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uid VARCHAR(64) UNIQUE NOT NULL,      -- Google subject ID
    name VARCHAR(64),
    email VARCHAR(64),
    role INT NOT NULL,
    phone_number VARCHAR(15),
    rewards INT DEFAULT 0
);

CREATE INDEX idx_users_uid ON users (uid); -- I believe already made with "unique" but leave it in.

CREATE TABLE menu_items (
id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
name VARCHAR(64) NOT NULL,
price NUMERIC(10,2) NOT NULL,
description VARCHAR(255),
is_modification bool NOT NULL,
category VARCHAR(64)
);

CREATE TABLE inventory (
id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
name VARCHAR(64) NOT NULL,
quantity INT NOT NULL,
restock_price NUMERIC(10,2) NOT NULL
);

CREATE TABLE orders (
id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
customer_id INT,
timestamp timestamp NOT NULL,
total_price NUMERIC(10,2) NOT NULL,
pearls_earned INT,
employee_id INT NOT NULL,
payment_method VARCHAR(20) NOT NULL,
CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES users(id),
CONSTRAINT fk_employee FOREIGN KEY (employee_id) REFERENCES users(id)
);

CREATE TABLE joint_order_items (
order_id INT NOT NULL,
menu_item_id INT NOT NULL,
CONSTRAINT fk_order_id FOREIGN KEY (order_id) REFERENCES orders(id),
CONSTRAINT fk_menu_item_id FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

CREATE TABLE joint_recipe_ingredients (
menu_item_id INT NOT NULL,
inventory_item_id INT NOT NULL,
quantity_used INT NOT NULL,
CONSTRAINT fk_menu_item_id FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
CONSTRAINT fk_inventory_item_id FOREIGN KEY (inventory_item_id) REFERENCES inventory(id)
);

CREATE INDEX idx_joint_order_items_order_id ON joint_order_items (order_id);

CREATE INDEX idx_joint_order_items_menu_item_id ON joint_order_items (menu_item_id);