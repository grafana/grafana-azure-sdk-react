import { AzureCloudInfo, config } from '@grafana/runtime';

export enum AzureCloud {
  Public = 'AzureCloud',
  China = 'AzureChinaCloud',
  USGovernment = 'AzureUSGovernment',
  None = '',
}

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

export function getDefaultAzureCloud(): string {
  return config.azure.cloud || AzureCloud.Public;
}
