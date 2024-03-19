export type AzureAuthType = 'currentuser' | 'msi' | 'workloadidentity' | 'clientsecret' | 'clientsecret-obo';

export type ConcealedSecret = symbol;

interface AzureCredentialsBase {
  authType: AzureAuthType;
}

interface AadCurrentUserCredentials extends AzureCredentialsBase {
  authType: 'currentuser';
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

interface AzureClientSecretOboCredentials extends AzureCredentialsBase {
  authType: 'clientsecret-obo';
  azureCloud?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string | ConcealedSecret;
}

export type AzureCredentials =
  | AadCurrentUserCredentials
  | AzureManagedIdentityCredentials
  | AzureWorkloadIdentityCredentials
  | AzureClientSecretCredentials
  | AzureClientSecretOboCredentials;
