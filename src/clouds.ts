import { AzureSettings, config } from '@grafana/runtime';

interface AzureSettings2 extends AzureSettings {
  clouds?: AzureCloudInfo[];
}

export interface AzureCloudInfo {
  name: string;
  displayName: string;
}

const predefinedClouds: AzureCloudInfo[] = [
  {
    name: 'AzureCloud', displayName: 'Azure'
  },
  {
    name: 'AzureChinaCloud', displayName: 'Azure China'
  },
  {
    name: 'AzureUSGovernment', displayName: 'Azure US Government'
  }
];

export function getAzureClouds(): AzureCloudInfo[] {
  const settingsEx = (config.azure as unknown as AzureSettings2);

  // Return list of clouds from Grafana configuration if they are provided
  if (Array.isArray(settingsEx.clouds)) {
    return settingsEx.clouds;
  }

  return predefinedClouds;
}
