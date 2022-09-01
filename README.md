# Saleor TaxJar App

The sales tax calculation with using TaxJar API.

The app uses synchronous webhooks: `checkout-calculate-taxes`, `order-calculate-taxes`, to calculate sales taxes for Saleor.
The TaxJar's order transaction is created for each `US` order (by using `order-created` webhook).
The App assumes that the received prices from Saleor are always `.net` prices.

## How to use this project

### Installation

App installation on Saleor is described here:

- from the command line: https://docs.saleor.io/docs/3.x/developer/extending/apps/installing-apps#installing-third-party-apps
- from graphQL API: https://docs.saleor.io/docs/3.x/developer/extending/apps/installing-apps#installation-using-graphql-api
- from dashboard: `https://<saleor-domain>/apps/install?manifestUrl=https://<app-domain>/api/manifest`

where `manifest` path is `https://<app-domain>/api/manifest`.

### Configuration

The App configuration can be done from the Saleor dashboard. After sucesfull app installation, go to `saleor-dashboard -> apps -> Saleor TaxJar`:

- `API Key` is mandatory to activate the app. To generate API key, go to TaxJar admin pannel -> Account -> API Access.
- `Ship from` details are mandatory for correct tax calculation.
- Enable `Active` when you are ready to use TaxJar App.
- Enable `Sandbox` when you use TaxJar in sandbox mode.

> **Note**
> Checkouts and orders that are related to not configured channels will be skipped by App. Taxes will not be calculated for them. Make sure that you activate TaxJar App for all required channels.

The TaxJar tax group can be set in `Product` metadata or `ProductType` metadata. The expected metadata field name is `taxjar_tax_code`. The TaxJar tax groups can be found [here](https://developers.taxjar.com/api/reference/#get-list-tax-categories).
When the tax group is not set, the standard tax group will be used.

### Local development

Update `.env` file:

```
SALEOR_DOMAIN=your-saleor-instance.com
```

Install dependencies `pnpm install`

Start local server `pnpm run dev`

Follow the guide [how install your app](https://docs.saleor.io/docs/3.x/developer/extending/apps/installing-apps#installation-using-graphql-api) and use tunneling tools like [localtunnel](https://github.com/localtunnel/localtunnel) or [ngrok](https://ngrok.com/) in order to expose your local server.

If you use [saleor-dashboard](https://github.com/saleor/saleor-dashboard) and your local server is exposed, you can install your app by following this link:

```
[YOUR_SALEOR_DASHBOARD_URL]/apps/install?manifestUrl=[YOUR_APPS_MANIFEST_URL]
```

### Generated schema and typings

Commands `build` and `dev` would generate schema and typed functions using Saleor's GraphQL endpoint. Commit `generated` folder to your repo as they are necessary for queries and keeping track of the schema changes.

[Learn more](https://www.graphql-code-generator.com/) about GraphQL code generation.

### ENVs:

- `SETTINGS_ENCRYPTION_SECRET` - used to encrypt/decrypt secret data (like APIKey) that is stored in Saleor's App's private metadata.
- `SALEOR_DOMAIN ` - Only declared Saleor domain will be allowed to fetch taxes from the app.

## Learn more about Apps

- [Apps guide](https://docs.saleor.io/docs/3.x/developer/extending/apps/key-concepts)

- [Configuring apps in dashboard](https://docs.saleor.io/docs/3.x/dashboard/apps)

- [Saleor App Template](https://github.com/saleor/saleor-app-template)
