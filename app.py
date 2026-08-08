import os
import smtplib
import sqlite3
from datetime import datetime, timezone
from email.message import EmailMessage

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, send_from_directory

load_dotenv()  # loads .env file when running locally



app = Flask(__name__)
app.config["DATABASE"] = os.path.join(app.root_path, "leads.db")


@app.get("/favicon.ico")
def favicon():
    return send_from_directory(os.path.join(app.root_path, "static", "media"), "logo.png", mimetype="image/png")


def init_db():
    with sqlite3.connect(app.config["DATABASE"]) as conn:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT,
                service TEXT, message TEXT, created_at TEXT NOT NULL
            )"""
        )


def notify_owner(lead):
    """Emails the lead when SMTP settings are supplied by Render environment variables."""
    host = os.getenv("SMTP_HOST")
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    recipient = os.getenv("LEAD_RECIPIENT", "info.rshightech@gmail.com")
    if not all((host, username, password)):
        app.logger.warning("SMTP not configured: SMTP_HOST=%s, SMTP_USERNAME=%s, SMTP_PASSWORD=%s",
                           bool(host), bool(username), bool(password))
        return False

    msg = EmailMessage()
    msg["Subject"] = f"New website enquiry — {lead['service'] or 'General'}"
    msg["From"] = os.getenv("SMTP_FROM", username)
    msg["To"] = recipient
    msg.set_content(
        "New enquiry from RS HIGH TECH INDIA website\n\n"
        f"Name: {lead['name']}\nPhone: {lead['phone']}\nEmail: {lead['email'] or 'Not provided'}\n"
        f"Service: {lead['service'] or 'Not specified'}\nMessage: {lead['message'] or 'No message'}"
    )
    port = int(os.getenv("SMTP_PORT", "587"))
    with smtplib.SMTP(host, port, timeout=15) as server:
        server.starttls()
        server.login(username, password)
        server.send_message(msg)
    app.logger.info("Email sent to %s", recipient)
    return True


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/test-email")
def test_email():
    """Debug route — visit /test-email on Render to check SMTP config."""
    host     = os.getenv("SMTP_HOST")
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    if not all((host, username, password)):
        return jsonify(ok=False, message="SMTP env vars missing",
                       SMTP_HOST=bool(host), SMTP_USERNAME=bool(username), SMTP_PASSWORD=bool(password)), 500
    try:
        notify_owner({"name": "Test", "phone": "0000000000", "email": "test@test.com",
                      "service": "Test", "message": "Test email from /test-email route"})
        return jsonify(ok=True, message=f"Test email sent to {os.getenv('LEAD_RECIPIENT', 'info.rshightech@gmail.com')}")
    except Exception as e:
        return jsonify(ok=False, error=str(e)), 500


@app.post("/api/lead")
def create_lead():
    data = request.get_json(silent=True) or request.form
    lead = {key: str(data.get(key, "")).strip() for key in ("name", "phone", "email", "service", "message")}
    if len(lead["name"]) < 2 or len(lead["phone"]) < 8:
        return jsonify(ok=False, message="Please enter your name and a valid phone number."), 400

    with sqlite3.connect(app.config["DATABASE"]) as conn:
        conn.execute(
            "INSERT INTO leads (name, phone, email, service, message, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (*lead.values(), datetime.now(timezone.utc).isoformat()),
        )
    try:
        notify_owner(lead)
    except Exception as error:
        app.logger.error("Lead saved but notification could not be sent: %s", error)
    return jsonify(ok=True, message="Thank you. Our team will contact you shortly.")


init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=True)
