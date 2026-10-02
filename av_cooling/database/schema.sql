CREATE DATABASE IF NOT EXISTS av_cooling CHARACTER SET utf8mb4;
USE av_cooling;
CREATE TABLE roles(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(40) UNIQUE NOT NULL,label VARCHAR(80));
CREATE TABLE permissions(id INT AUTO_INCREMENT PRIMARY KEY,code VARCHAR(60) UNIQUE NOT NULL);
CREATE TABLE role_permissions(role_id INT,permission_id INT,PRIMARY KEY(role_id,permission_id),
 FOREIGN KEY(role_id) REFERENCES roles(id),FOREIGN KEY(permission_id) REFERENCES permissions(id));
CREATE TABLE users(id INT AUTO_INCREMENT PRIMARY KEY,role_id INT NOT NULL,name VARCHAR(100) NOT NULL,
 email VARCHAR(150) UNIQUE NOT NULL,password_hash VARCHAR(255) NOT NULL,status ENUM('active','disabled') DEFAULT 'active',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(role_id) REFERENCES roles(id));
CREATE TABLE customers(id INT AUTO_INCREMENT PRIMARY KEY,user_id INT UNIQUE NOT NULL,phone VARCHAR(30),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE addresses(id INT AUTO_INCREMENT PRIMARY KEY,customer_id INT NOT NULL,recipient VARCHAR(100),phone VARCHAR(30),
 address_line VARCHAR(255),city VARCHAR(80),is_default TINYINT DEFAULT 0,FOREIGN KEY(customer_id) REFERENCES customers(id));
CREATE TABLE brands(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(80) UNIQUE NOT NULL);
CREATE TABLE product_categories(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(80) UNIQUE NOT NULL);
CREATE TABLE products(id INT AUTO_INCREMENT PRIMARY KEY,category_id INT,brand_id INT,name VARCHAR(150) NOT NULL,model VARCHAR(80),
 description TEXT,specs TEXT,image VARCHAR(255),price DECIMAL(10,2) NOT NULL,discount_percent DECIMAL(5,2) DEFAULT 0,
 status ENUM('active','inactive') DEFAULT 'active',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INDEX(name),
 FOREIGN KEY(category_id) REFERENCES product_categories(id),FOREIGN KEY(brand_id) REFERENCES brands(id));
CREATE TABLE inventory(product_id INT PRIMARY KEY,quantity INT NOT NULL DEFAULT 0,reorder_level INT DEFAULT 5,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,FOREIGN KEY(product_id) REFERENCES products(id));
CREATE TABLE stock_movements(id INT AUTO_INCREMENT PRIMARY KEY,product_id INT NOT NULL,type ENUM('received','online_order','pos_sale','cancel_return','adjustment') NOT NULL,
 qty_change INT NOT NULL,reference VARCHAR(60),user_id INT,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,INDEX(product_id),
 FOREIGN KEY(product_id) REFERENCES products(id));
CREATE TABLE restock_requests(id INT AUTO_INCREMENT PRIMARY KEY,product_id INT NOT NULL,qty INT NOT NULL,requested_by INT,approved_by INT NULL,
 status ENUM('pending','approved','rejected','received') DEFAULT 'pending',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,FOREIGN KEY(product_id) REFERENCES products(id));
CREATE TABLE services(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL,description TEXT,price DECIMAL(10,2),
 duration_minutes INT DEFAULT 60,instructions TEXT,status ENUM('active','inactive') DEFAULT 'active');
CREATE TABLE carts(id INT AUTO_INCREMENT PRIMARY KEY,customer_id INT UNIQUE NOT NULL,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,FOREIGN KEY(customer_id) REFERENCES customers(id));
CREATE TABLE cart_items(id INT AUTO_INCREMENT PRIMARY KEY,cart_id INT NOT NULL,product_id INT NOT NULL,quantity INT NOT NULL,
 UNIQUE(cart_id,product_id),FOREIGN KEY(cart_id) REFERENCES carts(id),FOREIGN KEY(product_id) REFERENCES products(id));
CREATE TABLE orders(id INT AUTO_INCREMENT PRIMARY KEY,order_number VARCHAR(30) UNIQUE NOT NULL,customer_id INT NULL,source ENUM('online','pos') DEFAULT 'online',
 status ENUM('pending','confirmed','processing','ready_for_pickup','out_for_delivery','completed','cancelled') DEFAULT 'pending',
 fulfillment ENUM('delivery','pickup') DEFAULT 'delivery',recipient VARCHAR(100),contact VARCHAR(30),delivery_address VARCHAR(255),
 install_date DATE NULL,notes TEXT,subtotal DECIMAL(10,2),discount_total DECIMAL(10,2),total DECIMAL(10,2),cashier_id INT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 INDEX(status),FOREIGN KEY(customer_id) REFERENCES customers(id));
CREATE TABLE order_items(id INT AUTO_INCREMENT PRIMARY KEY,order_id INT NOT NULL,product_id INT NOT NULL,product_name VARCHAR(150),
 unit_price DECIMAL(10,2),discount_percent DECIMAL(5,2),quantity INT,line_total DECIMAL(10,2),
 FOREIGN KEY(order_id) REFERENCES orders(id),FOREIGN KEY(product_id) REFERENCES products(id));
CREATE TABLE payments(id INT AUTO_INCREMENT PRIMARY KEY,order_id INT NOT NULL,method ENUM('cod','cash','gcash','bank_transfer') DEFAULT 'cod',
 amount DECIMAL(10,2),status ENUM('unpaid','paid','failed','refunded') DEFAULT 'unpaid',paid_at DATETIME NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(order_id) REFERENCES orders(id));
CREATE TABLE technicians(id INT AUTO_INCREMENT PRIMARY KEY,user_id INT UNIQUE NOT NULL,phone VARCHAR(30),status ENUM('available','busy','off') DEFAULT 'available',FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE service_requests(id INT AUTO_INCREMENT PRIMARY KEY,customer_id INT NOT NULL,service_id INT NOT NULL,ac_info VARCHAR(255),
 problem TEXT,address VARCHAR(255),notes TEXT,status ENUM('pending','scheduled','in_progress','completed','cancelled') DEFAULT 'pending',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(customer_id) REFERENCES customers(id),FOREIGN KEY(service_id) REFERENCES services(id));
CREATE TABLE appointments(id INT AUTO_INCREMENT PRIMARY KEY,service_request_id INT NOT NULL,appt_date DATE NOT NULL,appt_time TIME NOT NULL,
 status ENUM('booked','completed','cancelled') DEFAULT 'booked',
 slot_key VARCHAR(30) NULL UNIQUE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(service_request_id) REFERENCES service_requests(id));
CREATE TABLE technician_assignments(id INT AUTO_INCREMENT PRIMARY KEY,technician_id INT NOT NULL,job_type ENUM('delivery','service') NOT NULL,
 order_id INT NULL,appointment_id INT NULL,status ENUM('assigned','in_progress','completed') DEFAULT 'assigned',notes TEXT,
 assigned_by INT,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 INDEX(technician_id),FOREIGN KEY(technician_id) REFERENCES technicians(id));
CREATE TABLE feedback(id INT AUTO_INCREMENT PRIMARY KEY,customer_id INT NOT NULL,order_id INT NULL,service_request_id INT NULL,
 rating TINYINT NOT NULL,comment TEXT,sentiment ENUM('positive','neutral','negative') DEFAULT 'neutral',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(customer_id) REFERENCES customers(id));
CREATE TABLE notifications(id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,message VARCHAR(255),is_read TINYINT DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,INDEX(user_id));
CREATE TABLE audit_logs(id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NULL,action VARCHAR(80),details VARCHAR(255),ip VARCHAR(45),created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE settings(`key` VARCHAR(60) PRIMARY KEY,value VARCHAR(255));
INSERT INTO settings VALUES('payment_gcash','0'),('payment_bank_transfer','0');
INSERT INTO roles(name,label) VALUES('admin','Admin'),('manager','Manager'),('service_staff','E-Commerce / Service Staff'),
('cashier','Cashier'),('inventory_staff','Sales / Inventory Staff'),('technician','Technician'),('customer','Customer');
INSERT INTO permissions(code) VALUES('view_orders'),('create_orders'),('update_orders'),('cancel_orders'),('view_products'),('manage_products'),
('view_inventory'),('record_stock'),('create_restock'),('approve_restock'),('use_pos'),('view_payments'),('manage_payments'),
('view_service_requests'),('manage_service_requests'),('schedule_technicians'),('view_assigned_jobs'),('update_assigned_jobs'),
('view_customers'),('view_feedback'),('view_reports'),('manage_staff'),('view_audit_logs'),('manage_settings'),('manage_services');
INSERT INTO role_permissions SELECT r.id,p.id FROM roles r JOIN permissions p WHERE r.name='admin';
INSERT INTO role_permissions SELECT r.id,p.id FROM roles r JOIN permissions p WHERE r.name='manager' AND p.code IN
('view_orders','update_orders','view_payments','view_products','view_inventory','approve_restock','view_service_requests','schedule_technicians','view_customers','view_feedback','view_reports');
INSERT INTO role_permissions SELECT r.id,p.id FROM roles r JOIN permissions p WHERE r.name='service_staff' AND p.code IN
('view_orders','update_orders','view_payments','view_service_requests','manage_service_requests','view_customers');
INSERT INTO role_permissions SELECT r.id,p.id FROM roles r JOIN permissions p WHERE r.name='cashier' AND p.code IN
('use_pos','create_orders','view_payments','view_products');
INSERT INTO role_permissions SELECT r.id,p.id FROM roles r JOIN permissions p WHERE r.name='inventory_staff' AND p.code IN
('view_products','manage_products','view_inventory','record_stock','create_restock');
INSERT INTO role_permissions SELECT r.id,p.id FROM roles r JOIN permissions p WHERE r.name='technician' AND p.code IN
('view_assigned_jobs','update_assigned_jobs');
