import os
from flask import Flask, jsonify
from flask_cors import CORS
import mysql.connector
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)

def get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
    )

@app.get("/api/health")
def health():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT DATABASE(), VERSION()")
    db, version = cur.fetchone()
    cur.close()
    conn.close()
    return jsonify(status="ok", database=db, mysql=version)

if __name__ == "__main__":
    app.run(debug=True, port=5000)