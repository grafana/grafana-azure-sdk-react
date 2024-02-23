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
  return predefinedClouds;
}
