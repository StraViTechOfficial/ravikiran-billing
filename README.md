# Ravi Kiran Ops — MVP prototype

Front-end-only prototype of an operations app for Ravi Kiran Enterprises (and sister concern T and L Enterprises), Moshi, Pune — an earth-moving machine hire business. Replaces their Excel sheets for billing, vehicles and staff.

## Run
Open `index.html` in Chrome/Edge (double-click). No server, no build, no env vars.

## Deploy (Vercel)
Every push to `main` redeploys. `npm run build` (`build.cjs`) writes `public/index.html`: minified script, a "Prototype · Stravitech" watermark on bills, and a lock so a saved copy only runs on ravikiran.stravitech.com.

## What's in the MVP
- **Home** — billed / received / to-collect, vehicles working, advance pending with staff.
- **Bills** — Quotation → Proforma Invoice → Tax Invoice, per-day challan rows (date, challan no, hours/days), transport, auto CGST/SGST (or IGST for other-state clients), no GST for T and L. Print / Save as PDF in their existing bill layout. Payments against each bill, including TDS.
- **Clients & Sites**, **Vehicles** (rate per hour/day, status, operator; earned − diesel = left after diesel; diesel average L/hr or L/day with a warning above the vehicle's normal), **Diesel** log (litres × price, pump, paid by), **Employees** (salary + daily allowance − advance taken = to pay).
- Bills can carry a **diesel charge** (litres × price) before GST, next to transport.
- **Download for Excel** (CSV) on bills, vehicles and employees.

Not in the MVP yet: daily logs, repairs/maintenance, logins, shared data across devices.
