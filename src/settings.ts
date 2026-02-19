import { DataSourceInstanceSettings, DataSourceJsonData, DataSourceSettings } from '@grafana/data';

import { AzureAuthType, AzureCredentials } from './credentials/AzureCredentials';

export interface AzureDataSourceJsonData extends DataSourceJsonData {
  // Azure credentials
  azureCredentials?: AzureCredentials;
  oauthPassThru?: boolean;

  // Legacy Azure credentials
  cloudName?: string;
  azureAuthType?: AzureAuthType;
  tenantId?: string;
  clientId?: string;
}

export interface AzureDataSourceSecureJsonData {
  azureClientSecret?: string;
  password?: string;

  // Use for certificate authentication
  clientCertificate?: string;
  privateKey?: string;
  certificatePassword?: string;

  // Legacy Azure credentials
  clientSecret?: string;
}

export type AzureDataSourceSettings = DataSourceSettings<AzureDataSourceJsonData, AzureDataSourceSecureJsonData>;
export type AzureDataSourceInstanceSettings = DataSourceInstanceSettings<AzureDataSourceJsonData>;
