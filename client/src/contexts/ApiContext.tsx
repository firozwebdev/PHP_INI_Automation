import axios, { AxiosInstance, AxiosResponse } from "axios";
import React, { createContext, ReactNode, useContext } from "react";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

interface PhpEnvironment {
  name: string;
  path: string;
  version?: string;
  iniPath?: string;
  extensionDir?: string;
  status: "active" | "inactive" | "error";
  isDefault?: boolean;
}

interface PhpInstallation {
  environments: PhpEnvironment[];
  activeEnvironment?: PhpEnvironment;
  systemInfo: {
    platform: string;
    architecture: string;
  };
}

interface ExtensionInfo {
  name: string;
  displayName: string;
  description: string;
  category: string;
  enabled: boolean;
  available: boolean;
  required: boolean;
  dependencies?: string[];
  conflicts?: string[];
  phpVersions?: string[];
}

interface BackupInfo {
  filename: string;
  fullPath: string;
  timestamp: Date;
  size: number;
  description?: string;
  version?: string;
}

interface IniContent {
  sections: Array<{
    name: string;
    settings: { [key: string]: string | boolean | number };
    comments: string[];
  }>;
  globalSettings: { [key: string]: string | boolean | number };
  extensions: {
    enabled: string[];
    disabled: string[];
    available: string[];
  };
}

interface ApiContextType {
  // PHP Environment APIs
  getPhpEnvironments: () => Promise<PhpInstallation>;
  getPhpVersionInfo: (version: string) => Promise<any>;
  validatePhpInstallation: (phpPath: string, version?: string) => Promise<any>;

  // INI File APIs
  getIniContent: (version: string) => Promise<{
    iniPath: string;
    content: IniContent;
    rawContent: string;
    lastModified: Date;
  }>;
  getRawIniContent: (
    version: string
  ) => Promise<{ iniPath: string; content: string; lastModified: Date }>;
  updateIniContent: (version: string, content: string) => Promise<any>;
  customizeIni: (version: string, customSettings?: any) => Promise<any>;
  validateIniContent: (
    content: string
  ) => Promise<{ isValid: boolean; errors: string[]; warnings: string[] }>;

  // Extension APIs
  getExtensions: (version: string) => Promise<{
    extensions: ExtensionInfo[];
    summary: any;
    extensionDir: string;
  }>;
  toggleExtension: (
    version: string,
    extensionName: string,
    enable: boolean
  ) => Promise<any>;
  bulkToggleExtensions: (
    version: string,
    extensions: Array<{ name: string; enable: boolean }>
  ) => Promise<any>;
  getExtensionInfo: (name: string) => Promise<ExtensionInfo>;

  // Backup APIs
  getBackups: (version: string) => Promise<{
    backups: BackupInfo[];
    totalCount: number;
    totalSize: number;
  }>;
  createBackup: (version: string, description?: string) => Promise<any>;
  restoreBackup: (
    version: string,
    backupPath: string,
    createBackupBeforeRestore?: boolean
  ) => Promise<any>;
  deleteBackup: (version: string, backupPath: string) => Promise<any>;
  getBackupContent: (version: string, backupPath: string) => Promise<any>;
  cleanupBackups: (
    version: string,
    keepCount?: number,
    olderThanDays?: number
  ) => Promise<any>;

  // Health check
  healthCheck: () => Promise<any>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
};

interface ApiProviderProps {
  children: ReactNode;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error("API Request Error:", error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  api.interceptors.response.use(
    (response: AxiosResponse) => {
      console.log(`API Response: ${response.status} ${response.config.url}`);
      return response;
    },
    (error) => {
      console.error(
        "API Response Error:",
        error.response?.data || error.message
      );
      return Promise.reject(error);
    }
  );

  const apiMethods: ApiContextType = {
    // PHP Environment APIs
    getPhpEnvironments: async () => {
      const response = await api.get("/php/environments");
      return response.data;
    },

    getPhpVersionInfo: async (version: string) => {
      const response = await api.get(`/php/version/${version}/info`);
      return response.data;
    },

    validatePhpInstallation: async (phpPath: string, version?: string) => {
      const response = await api.post("/php/validate", { phpPath, version });
      return response.data;
    },

    // INI File APIs
    getIniContent: async (version: string) => {
      const response = await api.get(`/ini/${version}/content`);
      return response.data;
    },

    getRawIniContent: async (version: string) => {
      const response = await api.get(`/ini/${version}/raw`);
      return response.data;
    },

    updateIniContent: async (version: string, content: string) => {
      const response = await api.post(`/ini/${version}/update`, { content });
      return response.data;
    },

    customizeIni: async (version: string, customSettings?: any) => {
      const response = await api.post(`/ini/${version}/customize`, {
        customSettings,
      });
      return response.data;
    },

    validateIniContent: async (content: string) => {
      const response = await api.post("/ini/default/validate", { content });
      return response.data;
    },

    // Extension APIs
    getExtensions: async (version: string) => {
      const response = await api.get(`/extension/${version}/list`);
      return response.data;
    },

    toggleExtension: async (
      version: string,
      extensionName: string,
      enable: boolean
    ) => {
      const response = await api.post(`/extension/${version}/toggle`, {
        extensionName,
        enable,
      });
      return response.data;
    },

    bulkToggleExtensions: async (
      version: string,
      extensions: Array<{ name: string; enable: boolean }>
    ) => {
      const response = await api.post(`/extension/${version}/bulk-toggle`, {
        extensions,
      });
      return response.data;
    },

    getExtensionInfo: async (name: string) => {
      const response = await api.get(`/extension/${name}/info`);
      return response.data;
    },

    // Backup APIs
    getBackups: async (version: string) => {
      const response = await api.get(`/backup/${version}/list`);
      return response.data;
    },

    createBackup: async (version: string, description?: string) => {
      const response = await api.post(`/backup/${version}/create`, {
        description,
      });
      return response.data;
    },

    restoreBackup: async (
      version: string,
      backupPath: string,
      createBackupBeforeRestore = true
    ) => {
      const response = await api.post(`/backup/${version}/restore`, {
        backupPath,
        createBackupBeforeRestore,
      });
      return response.data;
    },

    deleteBackup: async (version: string, backupPath: string) => {
      const response = await api.delete(`/backup/${version}/delete`, {
        data: { backupPath },
      });
      return response.data;
    },

    getBackupContent: async (version: string, backupPath: string) => {
      const response = await api.get(`/backup/${version}/content`, {
        params: { backupPath },
      });
      return response.data;
    },

    cleanupBackups: async (
      version: string,
      keepCount = 10,
      olderThanDays = 30
    ) => {
      const response = await api.post(`/backup/${version}/cleanup`, {
        keepCount,
        olderThanDays,
      });
      return response.data;
    },

    // Health check
    healthCheck: async () => {
      const response = await api.get("/health");
      return response.data;
    },
  };

  return (
    <ApiContext.Provider value={apiMethods}>{children}</ApiContext.Provider>
  );
};
