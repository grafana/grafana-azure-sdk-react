import { AzureCloudInfo, config } from '@grafana/runtime';

const predefinedClouds: AzureCloudInfo[] = [
  {
    name: 'AzureCloud',
    displayName: 'Azure',
  },
  {
    name: 'AzureChinaCloud',
    displayName: 'Azure China',
  },
  {
    name: 'AzureUSGovernment',
    displayName: 'Azure US Government',
  },
];

export function getAzureClouds(): AzureCloudInfo[] {
  const settingsEx = config.azure;

  // Return list of clouds from Grafana configuration if they are provided
  if (Array.isArray(settingsEx.clouds) && settingsEx.clouds.length > 0) {
    return settingsEx.clouds;
  }

  return predefinedClouds;
}
