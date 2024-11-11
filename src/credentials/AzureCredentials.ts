export type AzureAuthType =
  | 'currentuser'
  | 'msi'
  | 'workloadidentity'
  | 'clientsecret'
  | 'clientsecret-obo'
  | 'currentuser'
  | 'ad-password';

export type ConcealedSecret = symbol;

interface AzureCredentialsBase {
  authType: AzureAuthType;
}

export interface AadCurrentUserCredentials extends AzureCredentialsBase {
  authType: 'currentuser';
  serviceCredentials?:
    | AzureClientSecretCredentials
    | AzureManagedIdentityCredentials
    | AzureWorkloadIdentityCredentials;
  serviceCredentialsEnabled?: boolean;
}

export interface AzureManagedIdentityCredentials extends AzureCredentialsBase {
  authType: 'msi';
}

export interface AzureWorkloadIdentityCredentials extends AzureCredentialsBase {
  authType: 'workloadidentity';
}

export interface AzureClientSecretCredentials extends AzureCredentialsBase {
  authType: 'clientsecret';
  azureCloud?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string | ConcealedSecret;
}

export interface AzureClientSecretOboCredentials extends AzureCredentialsBase {
  authType: 'clientsecret-obo';
  azureCloud?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string | ConcealedSecret;
}

export interface AzureAdPasswordCredentials extends AzureCredentialsBase {
  authType: 'ad-password';
  userId?: string;
  clientId?: string;
  password?: string | ConcealedSecret;
}

export type AzureCredentials =
  | AadCurrentUserCredentials
  | AzureManagedIdentityCredentials
  | AzureWorkloadIdentityCredentials
  | AzureClientSecretCredentials
  | AzureClientSecretOboCredentials
  | AzureAdPasswordCredentials;

export function instanceOfAzureCredential<T extends AzureCredentials>(
  authType: AzureAuthType,
  object?: AzureCredentials
): object is T {
  if (!object) {
    return false;
  }
  return object.authType === authType;
}
