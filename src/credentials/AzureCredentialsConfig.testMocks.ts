import { AzureDataSourceSettings } from '../settings';

// Predefined mock data for different credential scenarios
export const dataSourceSettingsWithMsiCredentials: Partial<AzureDataSourceSettings> = {
  jsonData: { azureCredentials: { authType: 'msi' } },
};

export const dataSourceSettingsWithWorkloadIdentityCredentials: Partial<AzureDataSourceSettings> = {
  jsonData: { azureCredentials: { authType: 'workloadidentity' } },
};

export const dataSourceSettingsWithClientSecretInSecureJSONData: Partial<AzureDataSourceSettings> = {
  jsonData: { azureCredentials: { authType: 'clientsecret', clientId: 'testClientId', tenantId: 'testTenantId' } },
  secureJsonFields: { azureClientSecret: false },
  secureJsonData: { azureClientSecret: 'testClientSecret' },
};

export const dataSourceSettingsWithClientSecretOnServer: Partial<AzureDataSourceSettings> = {
  jsonData: { azureCredentials: { authType: 'clientsecret', clientId: 'testClientId', tenantId: 'testTenantId' } },
  secureJsonFields: { azureClientSecret: true },
};

export const dataSourceSettingsWithLegacyClientSecretOnServer: Partial<AzureDataSourceSettings> = {
  jsonData: { azureCredentials: { authType: 'clientsecret', clientId: 'testClientId', tenantId: 'testTenantId' } },
  secureJsonFields: { clientSecret: true },
};

export const baseMockClientSecretCredentials = {
  authType: 'clientsecret',
  azureCloud: 'AzureCloud',
  tenantId: 'testTenantId',
  clientId: 'testClientId',
};
