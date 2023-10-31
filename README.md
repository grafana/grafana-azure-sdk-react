# Grafana Azure SDK

A frontend package that can be used to share code across all Azure plugins.

## Drone configuration

Drone signs the Drone configuration file. This needs to be run every time the drone.yml file is modified. See https://github.com/grafana/deployment_tools/blob/master/docs/infrastructure/drone/signing.md for more info.

### Update drone build

If you have not installed drone CLI follow [these instructions](https://docs.drone.io/cli/install/)

To sign the `.drone.yml` file:

```bash
# Get your drone token from https://drone.grafana.net/account
export DRONE_TOKEN=<Your DRONE_TOKEN>

drone --server https://drone.grafana.net sign --save grafana/grafana-azure-sdk-react
```
