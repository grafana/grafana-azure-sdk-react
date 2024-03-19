import { AzureSettings, config } from '@grafana/runtime';

// TODO: Remove when the list of clouds added directly to @grafana/runtime
//  https://github.com/grafana/grafana/pull/84039
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
