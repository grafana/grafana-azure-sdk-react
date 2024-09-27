import { config } from '@grafana/runtime';

import { getDefaultAzureCloud } from '../clouds';
import {
  AadCurrentUserCredentials,
  AzureClientSecretCredentials,
  AzureCredentials,
  ConcealedSecret,
  instanceOfAzureCredential,
} from './AzureCredentials';
import { AzureDataSourceInstanceSettings, AzureDataSourceSettings } from '../settings';

export const concealed: ConcealedSecret = Symbol('Concealed client secret');
export const concealedLegacy: ConcealedSecret = Symbol('Concealed legacy client secret');

export function isCredentialsComplete(credentials: AzureCredentials, ignoreSecret = false): boolean {
  switch (credentials.authType) {
    case 'msi':
    case 'workloadidentity':
    case 'currentuser':
      return true;
    case 'clientsecret':
      return !!(
        credentials.azureCloud &&
        credentials.tenantId &&
        credentials.clientId &&
        // When ignoreSecret is set we consider the credentials complete without checking the secret
        !!(ignoreSecret || credentials.clientSecret)
      );
    default:
      throw new Error(`The auth type '${credentials.authType}' not supported.`);
  }
}

export function getClientSecret(
  options: AzureDataSourceSettings | AzureDataSourceInstanceSettings
): undefined | string | ConcealedSecret {
  if (!('secureJsonFields' in options) || !options.hasOwnProperty('secureJsonFields')) {
    return undefined;
  }

  if (options.secureJsonFields.azureClientSecret) {
    // The secret is concealed on server
    return concealed;
  } else if (options.secureJsonFields.clientSecret) {
    // Legacy client secret
    return concealedLegacy;
  } else {
    const secret = options.secureJsonData?.azureClientSecret;
    return typeof secret === 'string' && secret.length > 0 ? secret : undefined;
  }
}

export function getDatasourceCredentials(
  options: AzureDataSourceSettings | AzureDataSourceInstanceSettings
): AzureCredentials | undefined {
  const credentials = options.jsonData.azureCredentials;

  // If no credentials are set, return undefined to let the datasource fallback to its configured default credentials
  if (!credentials) {
    return undefined;
  }

  switch (credentials.authType) {
    case 'msi':
    case 'workloadidentity':
      if (
        (credentials.authType === 'msi' && config.azure.managedIdentityEnabled) ||
        (credentials.authType === 'workloadidentity' && config.azure.workloadIdentityEnabled)
      ) {
        return {
          authType: credentials.authType,
        };
      } else {
        // If authentication type is managed identity or workload identity but either method is disabled in Grafana config,
        // then return undefined to let the datasource fallback to its configured default credentials
        return undefined;
      }
    case 'clientsecret':
      return {
        authType: credentials.authType,
        azureCloud: credentials.azureCloud || getDefaultAzureCloud(),
        tenantId: credentials.tenantId,
        clientId: credentials.clientId,
        clientSecret: getClientSecret(options),
      };
  }
  if (instanceOfAzureCredential<AadCurrentUserCredentials>(credentials.authType, credentials)) {
    if (instanceOfAzureCredential<AzureClientSecretCredentials>('clientsecret', credentials.serviceCredentials)) {
      const serviceCredentials = { ...credentials.serviceCredentials, clientSecret: getClientSecret(options) };
      return {
        authType: credentials.authType,
        serviceCredentialsEnabled: credentials.serviceCredentialsEnabled,
        serviceCredentials,
      };
    }
    return {
      authType: credentials.authType,
      serviceCredentialsEnabled: credentials.serviceCredentialsEnabled,
      serviceCredentials: credentials.serviceCredentials,
    };
  }

  throw new Error(`The auth type '${credentials.authType}' not supported.`);
}

export function updateDatasourceCredentials(
  options: AzureDataSourceSettings,
  credentials: AzureCredentials
): AzureDataSourceSettings {
  // Cleanup any legacy credentials if they exist
  options = {
    ...options,
    jsonData: {
      ...options.jsonData,
      azureAuthType: undefined,
      cloudName: undefined,
      tenantId: undefined,
      clientId: undefined,
    },
  };

  switch (credentials.authType) {
    case 'msi':
    case 'workloadidentity':
      if (credentials.authType === 'msi' && !config.azure.managedIdentityEnabled) {
        throw new Error('Managed Identity authentication is not enabled in Grafana config.');
      }
      if (credentials.authType === 'workloadidentity' && !config.azure.workloadIdentityEnabled) {
        throw new Error('Workload Identity authentication is not enabled in Grafana config.');
      }

      options = {
        ...options,
        jsonData: {
          ...options.jsonData,
          azureCredentials: {
            authType: credentials.authType,
          },
        },
      };

      return options;

    case 'clientsecret':
      options = {
        ...options,
        jsonData: {
          ...options.jsonData,
          azureCredentials: {
            authType: credentials.authType,
            azureCloud: credentials.azureCloud || getDefaultAzureCloud(),
            tenantId: credentials.tenantId,
            clientId: credentials.clientId,
          },
        },
        secureJsonData: {
          ...options.secureJsonData,
          azureClientSecret:
            typeof credentials.clientSecret === 'string' && credentials.clientSecret.length > 0
              ? credentials.clientSecret
              : undefined,
        },
        secureJsonFields: {
          ...options.secureJsonFields,
          azureClientSecret: credentials.clientSecret === concealed,
          clientSecret: credentials.clientSecret === concealedLegacy,
        },
      };

      return options;
  }
  if (instanceOfAzureCredential<AadCurrentUserCredentials>('currentuser', credentials)) {
    const serviceCredentials = credentials.serviceCredentials;
    let clientSecret: string | symbol | undefined;
    if (instanceOfAzureCredential<AzureClientSecretCredentials>('clientsecret', serviceCredentials)) {
      clientSecret = serviceCredentials.clientSecret;
      // Do this to not expose the secret in unencrypted JSON data
      delete serviceCredentials.clientSecret;
    }
    options = {
      ...options,
      jsonData: {
        ...options.jsonData,
        azureAuthType: credentials.authType,
        azureCredentials: {
          authType: 'currentuser',
          serviceCredentialsEnabled: credentials.serviceCredentialsEnabled,
          serviceCredentials,
        },
      },
      secureJsonData: {
        ...options.secureJsonData,
        azureClientSecret: typeof clientSecret === 'string' && clientSecret.length > 0 ? clientSecret : undefined,
      },
      secureJsonFields: {
        ...options.secureJsonFields,
        azureClientSecret: clientSecret === concealed,
        clientSecret: clientSecret === concealedLegacy,
      },
    };

    return options;
  }

  throw new Error(`The auth type '${credentials.authType}' not supported.`);
}
