import { AzureCloudInfo } from '@grafana/data';
import { config } from '@grafana/runtime';

export enum AzureCloud {
  Public = 'AzureCloud',
  China = 'AzureChinaCloud',
  USGovernment = 'AzureUSGovernment',
  None = '',
}

const predefinedClouds: AzureCloudInfo[] = [
  { name: 'AzureCloud', displayName: 'Azure' },
  { name: 'AzureChinaCloud', displayName: 'Azure China' },
  { name: 'AzureUSGovernment', displayName: 'Azure US Government' },
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

export function resolveLegacyCloudName(cloudName: string | undefined): string | undefined {
  if (!cloudName) {
    // if undefined, allow the code to fallback to calling getDefaultAzureCloud() since that has the complete logic for handling an empty cloud name
    return undefined;
  }

  switch (cloudName) {
    case 'azuremonitor':
      return AzureCloud.Public;
    case 'chinaazuremonitor':
      return AzureCloud.China;
    case 'govazuremonitor':
      return AzureCloud.USGovernment;
    default:
      throw new Error(`Azure cloud '${cloudName}' is not recognized by datasource.`);
  }
}
