import { config } from '@grafana/runtime';

import { AzureDataSourceSettings } from '../settings';
import { AzureCredentials } from './AzureCredentials';
import {
  concealed,
  concealedLegacy,
  getDatasourceCredentials,
  updateDatasourceCredentials,
} from './AzureCredentialsConfig';
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

    it.each(['pem', 'pfx'] as const)(
      'should return certificate credentials from secure json data for %s format',
      (certificateFormat) => {
        const options = {
          jsonData: {
            azureCredentials: {
              authType: 'clientcertificate',
              azureCloud: 'AzureCloud',
              tenantId: 'testTenantId',
              clientId: 'testClientId',
              certificateFormat,
            },
          },
          secureJsonFields: {
            clientCertificate: false,
            privateKey: false,
            privateKeyPassword: false,
          },
          secureJsonData: {
            clientCertificate: 'testClientCertificate',
            privateKey: 'testPrivateKey',
            privateKeyPassword: 'testPrivateKeyPassword',
          },
        } as unknown as AzureDataSourceSettings;

        const result = getDatasourceCredentials(options);
        expect(result).toEqual({
          authType: 'clientcertificate',
          azureCloud: 'AzureCloud',
          tenantId: 'testTenantId',
          clientId: 'testClientId',
          certificateFormat,
          clientCertificate: 'testClientCertificate',
          privateKey: 'testPrivateKey',
          privateKeyPassword: 'testPrivateKeyPassword',
        });
      }
    );

    it.each(['pem', 'pfx'] as const)(
      'should return concealed certificate credentials when values are on server for %s format',
      (certificateFormat) => {
        const options = {
          jsonData: {
            azureCredentials: {
              authType: 'clientcertificate',
              azureCloud: 'AzureCloud',
              tenantId: 'testTenantId',
              clientId: 'testClientId',
              certificateFormat,
            },
          },
          secureJsonFields: {
            clientCertificate: true,
            privateKey: true,
            privateKeyPassword: true,
          },
        } as unknown as AzureDataSourceSettings;

        const result = getDatasourceCredentials(options);
        expect(result).toEqual({
          authType: 'clientcertificate',
          azureCloud: 'AzureCloud',
          tenantId: 'testTenantId',
          clientId: 'testClientId',
          certificateFormat,
          clientCertificate: concealed,
          privateKey: concealed,
          privateKeyPassword: concealed,
        });
      }
    );

    it.each(['pem', 'pfx'] as const)(
      'should return current user service credentials for client certificate %s format',
      (certificateFormat) => {
        jest.mocked(config).azure.userIdentityEnabled = true;
        const options = {
          jsonData: {
            azureCredentials: {
              authType: 'currentuser',
              serviceCredentialsEnabled: true,
              serviceCredentials: {
                authType: 'clientcertificate',
                azureCloud: 'AzureCloud',
                tenantId: 'testTenantId',
                clientId: 'testClientId',
                certificateFormat,
              },
            },
          },
          secureJsonFields: {
            clientCertificate: false,
            privateKey: false,
            privateKeyPassword: false,
          },
          secureJsonData: {
            clientCertificate: 'testClientCertificate',
            privateKey: 'testPrivateKey',
          },
        } as unknown as AzureDataSourceSettings;

        const result = getDatasourceCredentials(options);
        expect(result).toEqual({
          authType: 'currentuser',
          serviceCredentialsEnabled: true,
          serviceCredentials: {
            authType: 'clientcertificate',
            azureCloud: 'AzureCloud',
            tenantId: 'testTenantId',
            clientId: 'testClientId',
            certificateFormat,
            clientCertificate: 'testClientCertificate',
            privateKey: 'testPrivateKey',
          },
        });
      }
    );
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

    it('should update credentials with client certificate credentials in secure json data', () => {
      const options = dataSourceSettingsWithMsiCredentials as AzureDataSourceSettings;
      const result = updateDatasourceCredentials(options, {
        authType: 'clientcertificate',
        azureCloud: 'AzureCloud',
        tenantId: 'testTenantId',
        clientId: 'testClientId',
        certificateFormat: 'pem',
        clientCertificate: 'testClientCertificate',
        privateKey: 'testPrivateKey',
        privateKeyPassword: 'testPrivateKeyPassword',
      } as AzureCredentials);

      expect(result.jsonData.azureCredentials).toEqual({
        authType: 'clientcertificate',
        azureCloud: 'AzureCloud',
        tenantId: 'testTenantId',
        clientId: 'testClientId',
        certificateFormat: 'pem',
      });
      expect(result?.secureJsonData?.clientCertificate).toEqual('testClientCertificate');
      expect(result?.secureJsonData?.privateKey).toEqual('testPrivateKey');
      expect(result?.secureJsonData?.privateKeyPassword).toEqual('testPrivateKeyPassword');
      expect(result?.secureJsonFields?.clientCertificate).toEqual(false);
      expect(result?.secureJsonFields?.privateKey).toEqual(false);
      expect(result?.secureJsonFields?.privateKeyPassword).toEqual(false);
    });
  });
});
