import { config } from '@grafana/runtime';

import { AzureCredentials } from './AzureCredentials';
import {
  concealed,
  concealedLegacy,
  getDatasourceCredentials,
  updateDatasourceCredentials,
} from './AzureCredentialsConfig';
import { AzureDataSourceSettings } from '../settings';
import {
  baseMockClientSecretCredentials,
  dataSourceSettingsWithClientSecretInSecureJSONData,
  dataSourceSettingsWithClientSecretOnServer,
  dataSourceSettingsWithLegacyClientSecretOnServer,
  dataSourceSettingsWithMsiCredentials,
} from './AzureCredentialsConfig.testMocks';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'), // Keep the rest of the actual module
}));

describe('AzureCredentialsConfig', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('getDatasourceCredentials', () => {
    it('should return credentials for msi credentials when msi is enabled', () => {
      jest.mocked(config).azure.managedIdentityEnabled = true;
      const options = dataSourceSettingsWithMsiCredentials as AzureDataSourceSettings;
      const result = getDatasourceCredentials(options);
      expect(result).toEqual({ authType: 'msi' });
    });

    it('should return undefined for msi credentials when msi is disabled', () => {
      jest.mocked(config).azure.managedIdentityEnabled = false;
      const options = dataSourceSettingsWithMsiCredentials as AzureDataSourceSettings;
      const result = getDatasourceCredentials(options);
      expect(result).toBeUndefined();
    });

    it('should return correct credentials for client secret credentials in secure json data', () => {
      const options = dataSourceSettingsWithClientSecretInSecureJSONData as AzureDataSourceSettings;
      const result = getDatasourceCredentials(options);
      expect(result).toEqual({ ...baseMockClientSecretCredentials, clientSecret: 'testClientSecret' });
    });

    it('should return credentials for client secret credentials on server', () => {
      const options = dataSourceSettingsWithClientSecretOnServer as AzureDataSourceSettings;
      const result = getDatasourceCredentials(options);
      expect(result).toEqual({ ...baseMockClientSecretCredentials, clientSecret: concealed });
    });

    it('should return credentials for legacy client secret credentials on server', () => {
      const options = dataSourceSettingsWithLegacyClientSecretOnServer as AzureDataSourceSettings;
      const result = getDatasourceCredentials(options);
      expect(result).toEqual({ ...baseMockClientSecretCredentials, clientSecret: concealedLegacy });
    });

    it('should return undefined when no (non-legacy) credentials exist', () => {
      const options = { jsonData: { azureAuthType: 'msi' } } as AzureDataSourceSettings;
      const result = getDatasourceCredentials(options);
      expect(result).toBeUndefined();
    });
  });

  describe('updateDatasourceCredentials', () => {
    it('should throw if msi credentials are passed but msi is disabled', () => {
      jest.mocked(config).azure.managedIdentityEnabled = false;
      const options = dataSourceSettingsWithClientSecretInSecureJSONData as AzureDataSourceSettings;
      const credentials = { authType: 'msi' } as AzureCredentials;
      expect(() => updateDatasourceCredentials(options, credentials)).toThrow(
        'Managed Identity authentication is not enabled in Grafana config.'
      );
    });

    it('should update credentials with msi credentials when msi is enabled', () => {
      jest.mocked(config).azure.managedIdentityEnabled = true;

      const options = dataSourceSettingsWithClientSecretInSecureJSONData as AzureDataSourceSettings;
      const credentials = { authType: 'msi' } as AzureCredentials;
      const result = updateDatasourceCredentials(options, credentials);
      expect(result.jsonData.azureCredentials).toEqual({ authType: 'msi' });
    });

    it('should update credentials with client secret credentials in secure json data', () => {
      const options = dataSourceSettingsWithMsiCredentials as AzureDataSourceSettings;
      const result = updateDatasourceCredentials(options, {
        ...baseMockClientSecretCredentials,
        clientSecret: 'testClientSecret',
      } as AzureCredentials);
      expect(result.jsonData.azureCredentials).toEqual({ ...baseMockClientSecretCredentials });
      expect(result?.secureJsonData?.azureClientSecret).toEqual('testClientSecret');
      expect(result?.secureJsonFields?.clientSecret).toEqual(false);
      expect(result?.secureJsonFields?.azureClientSecret).toEqual(false);
    });

    it('should update credentials with client secret credentials on server', () => {
      const options = dataSourceSettingsWithMsiCredentials as AzureDataSourceSettings;
      const result = updateDatasourceCredentials(options, {
        ...baseMockClientSecretCredentials,
        clientSecret: concealed,
      } as AzureCredentials);
      expect(result.jsonData.azureCredentials).toEqual({ ...baseMockClientSecretCredentials });
      expect(result?.secureJsonData?.azureClientSecret).toBeUndefined();
      expect(result?.secureJsonFields?.azureClientSecret).toEqual(true);
      expect(result?.secureJsonFields?.clientSecret).toEqual(false);
    });

    it('should update credentials with legacy client secret credentials on server', () => {
      const options = dataSourceSettingsWithMsiCredentials as AzureDataSourceSettings;
      const result = updateDatasourceCredentials(options, {
        ...baseMockClientSecretCredentials,
        clientSecret: concealedLegacy,
      } as AzureCredentials);
      expect(result.jsonData.azureCredentials).toEqual({ ...baseMockClientSecretCredentials });
      expect(result?.secureJsonData?.azureClientSecret).toBeUndefined();
      expect(result?.secureJsonFields?.azureClientSecret).toEqual(false);
      expect(result?.secureJsonFields?.clientSecret).toEqual(true);
    });
  });
});
