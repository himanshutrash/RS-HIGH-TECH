# RS HIGH TECH INDIA website

Premium corporate marketing website and enquiry pipeline built with Flask. It is independent of the existing `assetflow-` application.

## Run locally

```powershell
cd D:\ODOO\assetflow\rs-high-tech-india
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Visit `http://localhost:5000`.

## Receiving form submissions

Every quote/contact submission is stored in `leads.db`. To also receive it by email, copy `.env.example` to `.env` and add SMTP credentials. For Gmail, use a Google App Password (not your regular password). On Render, add the same settings under **Environment**:

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USERNAME=your Gmail address`
- `SMTP_PASSWORD=your Google App Password`
- `SMTP_FROM=your Gmail address`
- `LEAD_RECIPIENT=gauravkushwaha8850@gmail.com`

## Deploy to Render

Push this directory to its own Git repository and create a Render Blueprint (or Web Service) from it. `render.yaml` already supplies the build and start commands. Add the SMTP environment values before going live.

> Render's local filesystem is ephemeral. Email is the dependable delivery mechanism. If you want permanent lead history too, attach a Render Postgres database and migrate the SQLite storage.

## Replacing imagery

The visual placeholders currently use high-quality remote engineering images. Replace the image URLs in `static/css/style.css` with uploaded project media when available; the sections and cards will preserve their layout.
