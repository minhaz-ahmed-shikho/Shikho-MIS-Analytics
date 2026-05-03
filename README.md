# Shikho Finance Dashboard Automated

Standalone Vercel project for the Shikho Finance Governance Dashboard.

## Data Source

The dashboard reads live data from Google Sheets through `api/dashboard-data.js`.

Because the Google Sheet is public view-only, the API can run without secrets by reading Google's public CSV export. If service-account environment variables are present, it will use the authenticated Google Sheets API instead.

The Google Sheet `Config` tab controls the reporting period:

- `Actuals_To`: latest actual month shown in the dashboard
- `Forecast_From`: first forecast month
- `Forecast_To`: final forecast month
- `Budget_Year`: year used for budget comparisons
- `File_Last_Updated`: shown in the dashboard status banner

If `Actuals_To` points to an incomplete month, the API returns a validation warning and the dashboard keeps showing the latest complete period.

## Optional Vercel Environment Variables

Set these only if you want authenticated Google Sheets API access instead of public CSV access:

- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

The private key should keep newline characters escaped as `\n`.
