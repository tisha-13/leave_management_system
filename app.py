from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
import mysql.connector

app = Flask(__name__)
CORS(app, origins="*")

# ---------------- JWT CONFIG ----------------
app.config["JWT_SECRET_KEY"] = "your_secret_key"
jwt = JWTManager(app)

# ---------------- DATABASE CONNECTION ----------------
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="admin",
    database="leave_management"
)

cursor = db.cursor(dictionary=True)

# ---------------- HOME ----------------
@app.route('/')
def home():
    return "Leave Management System API Running"


# ---------------- LOGIN ----------------
@app.route('/login', methods=['POST'])
def login():

    data = request.get_json()

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({
            "message": "Missing Email or Password"
        }), 400

    query = """
    SELECT * FROM employees
    WHERE email=%s AND password=%s
    """

    cursor.execute(query, (email, password))
    user = cursor.fetchone()

    if user:

        access_token = create_access_token(
            identity=str(user['emp_id']),   # FIXED
            additional_claims={
                "role": user['role']
            }
        )

        return jsonify({
            "message": "Login Successful",
            "token": access_token,
            "emp_id": user['emp_id'],
            "name": user['name'],
            "role": user['role']
        }), 200

    return jsonify({
        "message": "Invalid Email or Password"
    }), 401


# ---------------- APPLY LEAVE ----------------
@app.route('/apply_leave', methods=['POST'])
@jwt_required()
def apply_leave():

    data = request.get_json()

    emp_id = get_jwt_identity()

    leave_type = data.get('leave_type')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    reason = data.get('reason')

    query = """
    INSERT INTO leaves
    (emp_id, leave_type, start_date, end_date, reason)
    VALUES (%s, %s, %s, %s, %s)
    """

    cursor.execute(
        query,
        (emp_id, leave_type, start_date, end_date, reason)
    )

    db.commit()

    return jsonify({
        "message": "Leave Applied Successfully"
    })


# ---------------- VIEW EMPLOYEE LEAVES ----------------
@app.route('/view_leaves/<int:emp_id>', methods=['GET'])
@jwt_required()
def view_leaves(emp_id):

    query = """
    SELECT *
    FROM leaves
    WHERE emp_id=%s
    ORDER BY leave_id DESC
    """

    cursor.execute(query, (emp_id,))
    leaves = cursor.fetchall()

    return jsonify(leaves)


# ---------------- ALL REQUESTS ----------------
@app.route('/all_requests', methods=['GET'])
@jwt_required()
def all_requests():

    query = """
    SELECT
        l.leave_id,
        e.name,
        l.leave_type,
        l.start_date,
        l.end_date,
        l.reason,
        l.status
    FROM leaves l
    JOIN employees e
    ON l.emp_id = e.emp_id
    ORDER BY l.leave_id DESC
    """

    cursor.execute(query)
    requests = cursor.fetchall()

    return jsonify(requests)


# ---------------- APPROVE LEAVE ----------------
@app.route('/approve_leave/<int:leave_id>', methods=['PUT'])
@jwt_required()
def approve_leave(leave_id):

    query = """
    UPDATE leaves
    SET status='Approved'
    WHERE leave_id=%s
    """

    cursor.execute(query, (leave_id,))
    db.commit()

    return jsonify({
        "message": "Leave Approved Successfully"
    })


# ---------------- REJECT LEAVE ----------------
@app.route('/reject_leave/<int:leave_id>', methods=['PUT'])
@jwt_required()
def reject_leave(leave_id):

    query = """
    UPDATE leaves
    SET status='Rejected'
    WHERE leave_id=%s
    """

    cursor.execute(query, (leave_id,))
    db.commit()

    return jsonify({
        "message": "Leave Rejected Successfully"
    })


# ---------------- RUN APP ----------------
if __name__ == '__main__':
    app.run(debug=True)