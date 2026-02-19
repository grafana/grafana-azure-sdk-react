import { config } from '@grafana/runtime';

import { getDefaultAzureCloud } from '../clouds';
import { AzureDataSourceInstanceSettings, AzureDataSourceSettings } from '../settings';
import {
  AadCurrentUserCredentials,
  AzureClientCertificateCredentials,
  AzureClientSecretCredentials,
  AzureCredentials,
  ConcealedSecret,
  instanceOfAzureCredential,
} from './AzureCredentials';

export const concealed: ConcealedSecret = Symbol('Concealed client secret');
export const concealedLegacy: ConcealedSecret = Symbol('Concealed legacy client secret');

export function isCredentialsComplete(credentials: AzureCredentials, ignoreSecret = false): boolean {
  const authType = credentials.authType;
  switch (authType) {
    case 'msi':
    case 'workloadidentity':
    case 'currentuser':
      return true;
    case 'clientsecret':
    case 'clientsecret-obo':
      return !!(
        credentials.azureCloud &&
        credentials.tenantId &&
        credentials.clientId &&
        // When ignoreSecret is set we consider the credentials complete without checking the secret
        !!(ignoreSecret || credentials.clientSecret)
      );
    case 'ad-password':
      return !!(credentials.clientId && credentials.password && credentials.userId);
    case 'clientcertificate':
      if (credentials.certificateFormat === 'pem') {
        return !!(
          credentials.azureCloud &&
          credentials.tenantId &&
          credentials.clientId &&
          credentials.clientCertificate &&
          credentials.privateKey
        );
      }
      if (credentials.certificateFormat === 'pfx') {
        return !!(
          credentials.azureCloud &&
          credentials.tenantId &&
          credentials.clientId &&
          credentials.clientCertificate &&
          credentials.privateKeyPassword
        );
      }

      return false;
    default:
      throw new Error(`The auth type '${authType}' not supported.`);
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

export function getAdPassword(
  options: AzureDataSourceSettings | AzureDataSourceInstanceSettings
): undefined | string | ConcealedSecret {
  if (!('secureJsonFields' in options) || !options.hasOwnProperty('secureJsonFields')) {
    return undefined;
  }

  if (options.secureJsonFields.password) {
    // The secret is concealed on server
    return concealed;
  } else {
    const secret = options.secureJsonData?.password;
    return typeof secret === 'string' && secret.length > 0 ? secret : undefined;
  }
}

export function getClientCertificate(
  options: AzureDataSourceSettings | AzureDataSourceInstanceSettings
): undefined | string | ConcealedSecret {
  if (!('secureJsonFields' in options) || !options.hasOwnProperty('secureJsonFields')) {
    return undefined;
  }

  if (options.secureJsonFields.clientCertificate) {
    // The certificate is concealed on server
    return concealed;
  }

  const certificate = options.secureJsonData?.clientCertificate;
  return typeof certificate === 'string' && certificate.length > 0 ? certificate : undefined;
}

export function getPrivateKey(
  options: AzureDataSourceSettings | AzureDataSourceInstanceSettings
): undefined | string | ConcealedSecret {
  if (!('secureJsonFields' in options) || !options.hasOwnProperty('secureJsonFields')) {
    return undefined;
  }

  if (options.secureJsonFields.privateKey) {
    // The private key is concealed on server
    return concealed;
  }

  const privateKey = options.secureJsonData?.privateKey;
  return typeof privateKey === 'string' && privateKey.length > 0 ? privateKey : undefined;
}

export function getPrivateKeyPassword(
  options: AzureDataSourceSettings | AzureDataSourceInstanceSettings
): undefined | string | ConcealedSecret {
  if (!('secureJsonFields' in options) || !options.hasOwnProperty('secureJsonFields')) {
    return undefined;
  }

  if (options.secureJsonFields.privateKeyPassword) {
    // The private key password is concealed on server
    return concealed;
  }

  const privateKeyPassword = options.secureJsonData?.privateKeyPassword;
  return typeof privateKeyPassword === 'string' && privateKeyPassword.length > 0 ? privateKeyPassword : undefined;
}

export function getDatasourceCredentials(
  options: AzureDataSourceSettings | AzureDataSourceInstanceSettings,
  oboEnabled?: boolean
): AzureCredentials | undefined {
  const credentials = options.jsonData.azureCredentials;

  // If no credentials are set, return undefined to let the datasource fallback to its configured default credentials
  if (!credentials) {
    return undefined;
  }

  const authType = credentials.authType;
  switch (authType) {
    case 'msi':
    case 'workloadidentity':
      if (
        (authType === 'msi' && config.azure.managedIdentityEnabled) ||
        (authType === 'workloadidentity' && config.azure.workloadIdentityEnabled)
      ) {
        return {
          authType: authType,
        };
      } else {
        // If authentication type is managed identity or workload identity but either method is disabled in Grafana config,
        // then return undefined to let the datasource fallback to its configured default credentials
        return undefined;
      }
    case 'clientsecret':
    case 'clientsecret-obo':
      if (authType === 'clientsecret-obo' && !oboEnabled) {
        // If authentication type is OBO but OBO were disabled in Grafana config,
        // then we should fall back to an empty default credentials
        return undefined;
      }
      return {
        authType: authType,
        azureCloud: credentials.azureCloud || getDefaultAzureCloud(),
        tenantId: credentials.tenantId,
        clientId: credentials.clientId,
        clientSecret: getClientSecret(options),
      };
    case 'ad-password':
      return {
        authType: authType,
        userId: credentials.userId,
        clientId: credentials.clientId,
        password: getAdPassword(options),
      };
    case 'clientcertificate':
      return {
        authType: authType,
        azureCloud: credentials.azureCloud || getDefaultAzureCloud(),
        tenantId: credentials.tenantId,
        clientId: credentials.clientId,
        certificateFormat: credentials.certificateFormat,
        clientCertificate: getClientCertificate(options),
        privateKey: getPrivateKey(options),
        privateKeyPassword: getPrivateKeyPassword(options),
      };
  }
  if (instanceOfAzureCredential<AadCurrentUserCredentials>(authType, credentials)) {
    if (!config.azure.userIdentityEnabled) {
      // If authentication type is current user but current user was disabled in Grafana config,
      // then we should fall back to an empty default credentials
      return undefined;
    }

    if (instanceOfAzureCredential<AzureClientSecretCredentials>('clientsecret', credentials.serviceCredentials)) {
      const serviceCredentials = { ...credentials.serviceCredentials, clientSecret: getClientSecret(options) };
      return {
        authType: authType,
        serviceCredentialsEnabled: credentials.serviceCredentialsEnabled,
        serviceCredentials,
      };
    }
    if (
      instanceOfAzureCredential<AzureClientCertificateCredentials>('clientcertificate', credentials.serviceCredentials)
    ) {
      const serviceCredentials = {
        ...credentials.serviceCredentials,
        clientCertificate: getClientCertificate(options),
        privateKey: getPrivateKey(options),
        privateKeyPassword: getPrivateKeyPassword(options),
      };
      return {
        authType: authType,
        serviceCredentialsEnabled: credentials.serviceCredentialsEnabled,
        serviceCredentials,
      };
    }
    return {
      authType: authType,
      serviceCredentialsEnabled: credentials.serviceCredentialsEnabled,
      serviceCredentials: credentials.serviceCredentials,
    };
  }

  throw new Error(`The auth type '${authType}' is not supported.`);
}

export function updateDatasourceCredentials(
  options: AzureDataSourceSettings,
  credentials: AzureCredentials,
  oboEnabled?: boolean
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

  const authType = credentials.authType;
  switch (authType) {
    case 'msi':
    case 'workloadidentity':
      if (authType === 'msi' && !config.azure.managedIdentityEnabled) {
        throw new Error('Managed Identity authentication is not enabled in Grafana config.');
      }
      if (authType === 'workloadidentity' && !config.azure.workloadIdentityEnabled) {
        throw new Error('Workload Identity authentication is not enabled in Grafana config.');
      }

      options = {
        ...options,
        jsonData: {
          ...options.jsonData,
          azureCredentials: {
            authType: authType,
          },
        },
      };

      return options;

    case 'clientsecret':
    case 'clientsecret-obo':
      if (authType === 'clientsecret-obo' && !oboEnabled) {
        throw new Error('Client Secret OBO authentication is not enabled in Grafana config.');
      }

      options = {
        ...options,
        jsonData: {
          ...options.jsonData,
          azureCredentials: {
            authType: authType,
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

      if (authType === 'clientsecret-obo') {
        options = {
          ...options,
          jsonData: {
            ...options.jsonData,
            oauthPassThru: true,
          },
        };
      }

      return options;

    case 'ad-password':
      options = {
        ...options,
        jsonData: {
          ...options.jsonData,
          azureCredentials: {
            authType: 'ad-password',
            userId: credentials.userId,
            clientId: credentials.clientId,
          },
        },
        secureJsonData: {
          ...options.secureJsonData,
          password:
            typeof credentials.password === 'string' && credentials.password.length > 0
              ? credentials.password
              : undefined,
        },
        secureJsonFields: {
          ...options.secureJsonFields,
          password: typeof credentials.password === 'symbol',
        },
      };

      return options;
    case 'clientcertificate':
      options = {
        ...options,
        jsonData: {
          ...options.jsonData,
          azureCredentials: {
            authType: 'clientcertificate',
            azureCloud: credentials.azureCloud || getDefaultAzureCloud(),
            tenantId: credentials.tenantId,
            clientId: credentials.clientId,
            certificateFormat: credentials.certificateFormat,
          },
        },
        secureJsonData: {
          ...options.secureJsonData,
          clientCertificate:
            typeof credentials.clientCertificate === 'string' && credentials.clientCertificate.length > 0
              ? credentials.clientCertificate
              : undefined,
          privateKey:
            typeof credentials.privateKey === 'string' && credentials.privateKey.length > 0
              ? credentials.privateKey
              : undefined,
          privateKeyPassword:
            typeof credentials.privateKeyPassword === 'string' && credentials.privateKeyPassword.length > 0
              ? credentials.privateKeyPassword
              : undefined,
        },
        secureJsonFields: {
          ...options.secureJsonFields,
          clientCertificate: credentials.clientCertificate === concealed,
          privateKey: credentials.privateKey === concealed,
          privateKeyPassword: credentials.privateKeyPassword === concealed,
        },
      };

      return options;
  }
  if (instanceOfAzureCredential<AadCurrentUserCredentials>('currentuser', credentials)) {
    if (!config.azure.userIdentityEnabled) {
      throw new Error('User Identity authentication is not enabled in Grafana config.');
    }

    const serviceCredentials = credentials.serviceCredentials;
    let clientSecret: string | symbol | undefined;
    if (instanceOfAzureCredential<AzureClientSecretCredentials>('clientsecret', serviceCredentials)) {
      clientSecret = serviceCredentials.clientSecret;
      // Do this to not expose the secret in unencrypted JSON data
      delete serviceCredentials.clientSecret;
    }
    let clientCertificate: string | symbol | undefined;
    let privateKey: string | symbol | undefined;
    let privateKeyPassword: string | symbol | undefined;
    if (instanceOfAzureCredential<AzureClientCertificateCredentials>('clientcertificate', serviceCredentials)) {
      clientCertificate = serviceCredentials.clientCertificate;
      privateKey = serviceCredentials.privateKey;
      privateKeyPassword = serviceCredentials.privateKeyPassword;
      // Do this to not expose the certificate in unencrypted JSON data
      delete serviceCredentials.clientCertificate;
      delete serviceCredentials.privateKey;
      delete serviceCredentials.privateKeyPassword;
    }
    options = {
      ...options,
      jsonData: {
        ...options.jsonData,
        azureCredentials: {
          authType: 'currentuser',
          serviceCredentialsEnabled: credentials.serviceCredentialsEnabled,
          serviceCredentials,
        },
        oauthPassThru: true,
        disableGrafanaCache: true,
      },
      secureJsonData: {
        ...options.secureJsonData,
        azureClientSecret: typeof clientSecret === 'string' && clientSecret.length > 0 ? clientSecret : undefined,
        clientCertificate:
          typeof clientCertificate === 'string' && clientCertificate.length > 0 ? clientCertificate : undefined,
        privateKey: typeof privateKey === 'string' && privateKey.length > 0 ? privateKey : undefined,
        privateKeyPassword:
          typeof privateKeyPassword === 'string' && privateKeyPassword.length > 0 ? privateKeyPassword : undefined,
      },
      secureJsonFields: {
        ...options.secureJsonFields,
        azureClientSecret: clientSecret === concealed,
        clientSecret: clientSecret === concealedLegacy,
        clientCertificate: clientCertificate === concealed,
        privateKey: privateKey === concealed,
        privateKeyPassword: privateKeyPassword === concealed,
      },
    };

    return options;
  }

  throw new Error(`The auth type '${authType}' is not supported.`);
}

export function hasCredentials(options: AzureDataSourceSettings): boolean {
  return !!options.jsonData.azureCredentials;
}
