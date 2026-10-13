# Ravi Kiran Ops — MVP prototype

Front-end-only prototype of an operations app for Ravi Kiran Enterprises (and sister concern T and L Enterprises), Moshi, Pune — an earth-moving machine hire business. Replaces their Excel sheets for billing, vehicles and staff.

## Run
Open `index.html` in Chrome/Edge (double-click). No server, no build, no env vars.

## Deploy
Hosted on Vercel as a static site (no build step, framework preset: Other). Every push to `main` redeploys. `vercel.json` sets `noindex` so search engines don't list it.
Data is saved in the browser's localStorage; Settings → *Download backup* exports it as JSON.

## What's in the MVP
- **Home** — billed / received / to-collect, vehicles working, advance pending with staff.
- **Bills** — Quotation → Proforma Invoice → Tax Invoice, per-day challan rows (date, challan no, hours/days), transport, auto CGST/SGST (or IGST for other-state clients), no GST for T and L. Print / Save as PDF in their existing bill layout. Payments against each bill, including TDS.
- **Clients & Sites**, **Vehicles** (rate per hour/day, status, operator, earnings), **Employees** (salary, daily bhatta, advances, salary payment with advance cut).
- **Download for Excel** (CSV) on bills, vehicles and employees.

Not in the MVP yet: daily logs, diesel, expenses/maintenance, per-machine profit, logins.
