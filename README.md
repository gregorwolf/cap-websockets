# CAP WebSockets Demo

It contains these folders and files, following the recommended project layout:

| File or Folder | Purpose                              |
| -------------- | ------------------------------------ |
| `app/`         | content for UI frontends goes here   |
| `db/`          | your domain models and data go here  |
| `srv/`         | your service models and code go here |
| `package.json` | project metadata and configuration   |
| `readme.md`    | this getting started guide           |

## Next Steps

- Open a new terminal and run `cds watch`
- (in VS Code simply choose _**Terminal** > Run Task > cds watch_)
- Start adding content, for example, a [db/schema.cds](db/schema.cds).

## Learn More

Learn more at https://cap.cloud.sap/docs/get-started/.

## Local testing

After you've deployed the application you can run:

```bash
cds bind uaa --to cap-websockets-uaa
```

to bind the local cap app for hybrid testing. For easy testing you also need to run an approuter. For this you have to store this `default-env.json`in the approuter folder:

```JSON
{
  "VCAP_SERVICES": {
    "xsuaa": [
      {
        "label": "xsuaa",
        "provider": null,
        "plan": "application",
        "name": "cap-websockets-uaa",
        "tags": ["xsuaa"],
        "instance_name": "cap-websockets-uaa",
        "binding_name": null,
        "credentials": {
        },
        "syslog_drain_url": null,
        "volume_mounts": []
      }
    ]
  },
  "destinations": [
    {
      "name": "cap-websockets",
      "url": "http://localhost:4004",
      "forwardAuthToken": true
    },
    {
      "name": "ui5",
      "url": "https://ui5.sap.com"
    }
  ]
}
```

Then you can run

```
cds watch --profile hybrid
```

in one terminal and

```
cd approuter
npm run start-local
```

in another terminal.
