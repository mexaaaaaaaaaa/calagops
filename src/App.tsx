import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { SlidersHorizontal } from 'lucide-react';
import {
  AccountApiKeysPage,
  AccountProfilePage,
  AccountSecurityPage,
  AccountSshKeysPage,
  ActivityLogPage,
  AdminDashboardPage,
  AdminResourcesPage,
  AppShell,
  AuthShell,
  blushCssVariablesResolver,
  blushMantineTheme,
  Button,
  ClientDashboardPage,
  DEFAULT_UI_PREFERENCES,
  dispatchClientServerAction,
  DropdownMenu,
  ErrorState,
  fetchAdminDashboardFromApi,
  fetchClientDashboardFromApi,
  inferScopeFromPath,
  nextRuntimeStateForPowerAction,
  PageHeader,
  PasswordInput,
  PETALNODES_BRAND,
  SANDBOX_ADMIN_EXTENSIONS,
  SANDBOX_ADMIN_FIXTURE,
  SANDBOX_ADMIN_NODES,
  SANDBOX_ALLOCATIONS,
  SANDBOX_API_KEYS,
  SANDBOX_BACKUPS,
  SANDBOX_CLIENT_FIXTURE,
  SANDBOX_CONSOLE_LOGS,
  SANDBOX_DATABASES,
  SANDBOX_EXTRA_SERVERS,
  SANDBOX_SCHEDULES,
  SANDBOX_SERVER_DETAILS,
  SANDBOX_SERVER_FILES,
  SANDBOX_SSH_KEYS,
  SANDBOX_STARTUP_CONFIG,
  SANDBOX_SUBUSERS,
  saveServerFileContentApi,
  sendServerPowerSignal,
  ServerBackupsPage,
  ServerConsolePage,
  ServerDatabasesPage,
  ServerFilesPage,
  ServerNetworkPage,
  ServerOverviewPage,
  ServerSchedulesPage,
  ServerSettingsPage,
  ServerStartupPage,
  ServerUsersPage,
  showToast,
  TextInput,
  uploadServerFilesApi,
  type AdminDashboardPayload,
  type CalagopusActivityEntry,
  type CalagopusAllocationRecord,
  type CalagopusApiKey,
  type CalagopusBackupRecord,
  type CalagopusConsoleLine,
  type CalagopusDatabaseRecord,
  type CalagopusFileEntry,
  type CalagopusScheduleRecord,
  type CalagopusScheduleTask,
  type CalagopusServerDetail,
  type CalagopusSshKeyRecord,
  type CalagopusStartupConfig,
  type CalagopusSubuserRecord,
  type CalagopusUserContext,
  type ClientDashboardPayload,
  type PetalnodesUiPreferences,
  type ServerPowerAction,
} from '../backend-extensions/io_calagopus_blush/frontend/src';

type ViewDataMode = 'fixture' | 'live' | 'loading' | 'empty' | 'error';

const UI_PREFS_STORAGE_KEY = 'petalnodes.ui.preferences';

const INITIAL_ADMIN_PROFILE: CalagopusUserContext = {
  id: 'usr-admin-01',
  username: 'elena.rostova',
  email: 'elena@petalnodes.cloud',
  isAdmin: true,
  permissions: ['*'],
};

const INITIAL_MEMBER_PROFILE: CalagopusUserContext = {
  id: 'usr-mem-02',
  username: 'lucas.meyer',
  email: 'lucas@petalnodes.cloud',
  isAdmin: false,
  permissions: [
    'control.console',
    'control.power',
    'file.read',
    'file.write',
    'database.read',
    'backup.read',
    'schedule.read',
    'allocation.read',
    'startup.read',
    'user.read',
    'settings.rename',
    'activity.read',
  ],
};

function loadUiPreferences(): PetalnodesUiPreferences {
  if (typeof window === 'undefined') return DEFAULT_UI_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(UI_PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_UI_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<PetalnodesUiPreferences>;
    return {
      confirmDestructiveActions:
        typeof parsed.confirmDestructiveActions === 'boolean'
          ? parsed.confirmDestructiveActions
          : DEFAULT_UI_PREFERENCES.confirmDestructiveActions,
      compactTableRows:
        typeof parsed.compactTableRows === 'boolean'
          ? parsed.compactTableRows
          : DEFAULT_UI_PREFERENCES.compactTableRows,
      consoleAutoScrollDefault:
        typeof parsed.consoleAutoScrollDefault === 'boolean'
          ? parsed.consoleAutoScrollDefault
          : DEFAULT_UI_PREFERENCES.consoleAutoScrollDefault,
    };
  } catch {
    return DEFAULT_UI_PREFERENCES;
  }
}

function parseServerRoute(path: string): { serverId: string; subRoute: string } | null {
  if (!path.startsWith('/server/')) return null;
  const segments = path.split('/').filter(Boolean);
  return {
    serverId: segments[1] ?? 'alpha-01',
    subRoute: segments[2] ?? 'console',
  };
}

function cryptoRandomToken(length: number): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const bytes = new Uint8Array(length);
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) {
      bytes[i] = (Date.now() + i * 31) & 0xff;
    }
  }
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

function DashboardVerificationHost() {
  const [currentPath, setCurrentPath] = React.useState<string>('/');
  const [isAdminRole, setIsAdminRole] = React.useState<boolean>(true);
  const [adminProfile, setAdminProfile] = React.useState<CalagopusUserContext>(INITIAL_ADMIN_PROFILE);
  const [memberProfile, setMemberProfile] = React.useState<CalagopusUserContext>(INITIAL_MEMBER_PROFILE);

  const [mode, setMode] = React.useState<ViewDataMode>('fixture');
  const [liveClientData, setLiveClientData] = React.useState<ClientDashboardPayload | null>(null);
  const [liveAdminData, setLiveAdminData] = React.useState<AdminDashboardPayload | null>(null);
  const [liveLoading, setLiveLoading] = React.useState<boolean>(false);
  const [liveError, setLiveError] = React.useState<string | null>(null);

  const [authEmail, setAuthEmail] = React.useState('elena@petalnodes.cloud');
  const [authPassword, setAuthPassword] = React.useState('');
  const [authError, setAuthError] = React.useState<string | null>(null);

  // Stateful Calagopus panel modules
  const [serverDetailsMap, setServerDetailsMap] = React.useState<Record<string, CalagopusServerDetail>>(
    () => ({ ...SANDBOX_SERVER_DETAILS }),
  );
  const [consoleLogs, setConsoleLogs] = React.useState<CalagopusConsoleLine[]>(() => [
    ...SANDBOX_CONSOLE_LOGS,
  ]);
  const [serverFiles, setServerFiles] = React.useState<CalagopusFileEntry[]>(() => [
    ...SANDBOX_SERVER_FILES,
  ]);
  const [databases, setDatabases] = React.useState<CalagopusDatabaseRecord[]>(() => [
    ...SANDBOX_DATABASES,
  ]);
  const [backups, setBackups] = React.useState<CalagopusBackupRecord[]>(() => [...SANDBOX_BACKUPS]);
  const [schedules, setSchedules] = React.useState<CalagopusScheduleRecord[]>(() => [
    ...SANDBOX_SCHEDULES,
  ]);
  const [allocations, setAllocations] = React.useState<CalagopusAllocationRecord[]>(() => [
    ...SANDBOX_ALLOCATIONS,
  ]);
  const [startupConfigs, setStartupConfigs] = React.useState<Record<string, CalagopusStartupConfig>>(
    () => ({ 'alpha-01': { ...SANDBOX_STARTUP_CONFIG } }),
  );
  const [subusers, setSubusers] = React.useState<CalagopusSubuserRecord[]>(() => [
    ...SANDBOX_SUBUSERS,
  ]);
  const [apiKeys, setApiKeys] = React.useState<CalagopusApiKey[]>(() => [...SANDBOX_API_KEYS]);
  const [sshKeys, setSshKeys] = React.useState<CalagopusSshKeyRecord[]>(() => [
    ...SANDBOX_SSH_KEYS,
  ]);
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState<boolean>(false);
  const [uiPreferences, setUiPreferences] = React.useState<PetalnodesUiPreferences>(() =>
    loadUiPreferences(),
  );
  const [activityEntries, setActivityEntries] = React.useState<CalagopusActivityEntry[]>(() => [
    ...SANDBOX_CLIENT_FIXTURE.activity,
  ]);

  const user = isAdminRole ? adminProfile : memberProfile;
  const scope = inferScopeFromPath(currentPath);
  const parsedServer = parseServerRoute(currentPath);
  const activeServerId = parsedServer?.serverId ?? 'alpha-01';

  const appendActivity = React.useCallback(
    (event: string, description: string, status: CalagopusActivityEntry['status'] = 'completed') => {
      const entry: CalagopusActivityEntry = {
        id: `act-${Date.now()}`,
        event,
        description,
        actor: user.username,
        ipAddress: '127.0.0.1',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status,
      };
      setActivityEntries((prev) => [entry, ...prev]);
    },
    [user.username],
  );

  const allFixtureServers = React.useMemo(
    () =>
      [...SANDBOX_CLIENT_FIXTURE.servers, ...SANDBOX_EXTRA_SERVERS].map((srv) => {
        const updated = serverDetailsMap[srv.uuidShort];
        return updated
          ? {
              ...srv,
              name: updated.name,
              state: updated.state,
              cpuPercent: updated.cpuPercent,
            }
          : srv;
      }),
    [serverDetailsMap],
  );

  const activeServerDetail: CalagopusServerDetail = React.useMemo(() => {
    const existing = serverDetailsMap[activeServerId];
    if (existing) return existing;
    const summary = allFixtureServers.find((s) => s.uuidShort === activeServerId);
    if (summary) {
      return {
        ...SANDBOX_SERVER_DETAILS['alpha-01'],
        ...summary,
        description: `${summary.eggName} container running on ${summary.node}.`,
        sftpHost: `sftp.${summary.node}.petalnodes.cloud`,
        sftpUsername: `${user.username.split('.')[0]}.${summary.uuidShort}`,
      };
    }
    return SANDBOX_SERVER_DETAILS['alpha-01'];
  }, [activeServerId, serverDetailsMap, allFixtureServers, user.username]);

  const activeServerAllocations = React.useMemo(() => {
    const matching = allocations.filter((a) => a.serverId === activeServerDetail.uuidShort);
    if (matching.length > 0) return matching;
    const [ip, portRaw] = activeServerDetail.allocation.split(':');
    return [
      {
        id: `alloc-default-${activeServerDetail.uuidShort}`,
        serverId: activeServerDetail.uuidShort,
        ip: ip ?? '198.51.100.14',
        alias: '',
        port: Number(portRaw) || 25565,
        notes: 'Primary server allocation',
        isPrimary: true,
      },
    ];
  }, [allocations, activeServerDetail]);

  const activeStartupConfig: CalagopusStartupConfig = React.useMemo(() => {
    const existing = startupConfigs[activeServerDetail.uuidShort];
    if (existing) return existing;
    return {
      ...SANDBOX_STARTUP_CONFIG,
      serverId: activeServerDetail.uuidShort,
    };
  }, [startupConfigs, activeServerDetail.uuidShort]);

  const liveControllerRef = React.useRef<AbortController | null>(null);

  const loadLiveApi = React.useCallback(async () => {
    liveControllerRef.current?.abort();
    const controller = new AbortController();
    liveControllerRef.current = controller;

    setLiveLoading(true);
    setLiveError(null);
    try {
      if (currentPath.startsWith('/admin')) {
        const res = await fetchAdminDashboardFromApi(controller.signal);
        if (!controller.signal.aborted) {
          setLiveAdminData(res);
        }
      } else {
        const res = await fetchClientDashboardFromApi(controller.signal);
        if (!controller.signal.aborted) {
          setLiveClientData(res);
        }
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setLiveError(
        err instanceof Error
          ? `${err.message}. Connect a running Calagopus Rust/Axum panel backend to stream live telemetry.`
          : 'Unable to reach Calagopus panel API.',
      );
    } finally {
      if (!controller.signal.aborted) {
        setLiveLoading(false);
      }
    }
  }, [currentPath]);

  React.useEffect(() => {
    if (mode === 'live') {
      void loadLiveApi();
      return () => {
        liveControllerRef.current?.abort();
      };
    }
    return undefined;
  }, [mode, loadLiveApi]);

  const resolvedClientData: ClientDashboardPayload | null = React.useMemo(() => {
    if (mode === 'fixture') {
      return {
        servers: allFixtureServers,
        activity: activityEntries,
      };
    }
    if (mode === 'empty') return { servers: [], activity: [] };
    if (mode === 'live') return liveClientData;
    return null;
  }, [mode, allFixtureServers, activityEntries, liveClientData]);

  const resolvedAdminData: AdminDashboardPayload | null = React.useMemo(() => {
    if (mode === 'fixture') return SANDBOX_ADMIN_FIXTURE;
    if (mode === 'empty') {
      return {
        system: {
          ...SANDBOX_ADMIN_FIXTURE.system,
          cpuHistory: [],
          memoryHistory: [],
        },
        auditLogs: [],
      };
    }
    if (mode === 'live') return liveAdminData;
    return null;
  }, [mode, liveAdminData]);

  const isLoading = mode === 'loading' || (mode === 'live' && liveLoading);
  const errorMessage =
    mode === 'error'
      ? 'Simulated backend failure: Calagopus daemon endpoint timed out.'
      : mode === 'live'
        ? liveError
        : null;

  const dataSourceLabel =
    mode === 'fixture'
      ? 'Preview Fixture'
      : mode === 'live'
        ? 'Live Panel API'
        : mode === 'loading'
          ? 'Loading State'
          : mode === 'empty'
            ? 'Empty State'
            : 'Error State';

  const notifyLiveDispatchError = (actionLabel: string, err: unknown) => {
    showToast({
      title: `${actionLabel} failed`,
      message: err instanceof Error ? err.message : 'Unable to reach Calagopus panel API.',
      tone: 'error',
    });
  };

  const handleServerPowerAction = (action: ServerPowerAction) => {
    if (mode === 'live') {
      void sendServerPowerSignal(activeServerDetail.uuidShort, action).catch((err) => {
        notifyLiveDispatchError('Power request', err);
      });
      return;
    }

    const nextState = nextRuntimeStateForPowerAction(action);
    const nowTime = new Date().toTimeString().slice(0, 8);
    setServerDetailsMap((prev) => ({
      ...prev,
      [activeServerDetail.uuidShort]: {
        ...activeServerDetail,
        state: nextState,
        cpuPercent: nextState === 'running' ? 18.4 : 0,
        uptimeSeconds: nextState === 'running' ? Math.max(60, activeServerDetail.uptimeSeconds) : 0,
      },
    }));

    setConsoleLogs((prev) => [
      ...prev,
      {
        id: `log-pwr-${Date.now()}`,
        timestamp: nowTime,
        level: action === 'stop' || action === 'kill' ? 'WARN' : 'INFO',
        source: 'WingsDaemon',
        message: `Power signal "${action}" dispatched for ${activeServerDetail.name} (${nextState}).`,
      },
    ]);
    appendActivity(`server:power.${action}`, `Dispatched "${action}" signal for ${activeServerDetail.name}.`);

    showToast({
      title: `Power signal: ${action}`,
      message: `${activeServerDetail.name} is now ${nextState}.`,
      tone: action === 'stop' || action === 'kill' ? 'warning' : 'success',
    });
  };

  const handleSendConsoleCommand = (command: string) => {
    if (mode === 'live') {
      void dispatchClientServerAction(activeServerDetail.uuidShort, 'command', 'POST', { command }).catch(
        (err) => notifyLiveDispatchError('Command dispatch', err),
      );
      return;
    }

    const nowTime = new Date().toTimeString().slice(0, 8);
    const responseMessage =
      command === 'list'
        ? 'There are 3 of a max of 20 players online: elena_dev, aria_mc, kira_builds'
        : command === 'tps'
          ? 'TPS from last 1m, 5m, 15m: 20.0, 20.0, 19.98'
          : command === 'save-all'
            ? 'Saved the game (chunks flushed to disk).'
            : `Executed command "${command}" on ${activeServerDetail.name}.`;

    setConsoleLogs((prev) => [
      ...prev,
      {
        id: `cmd-${Date.now()}`,
        timestamp: nowTime,
        level: 'CMD',
        source: user.username,
        message: command,
      },
      {
        id: `res-${Date.now() + 1}`,
        timestamp: nowTime,
        level: 'INFO',
        source: 'Server',
        message: responseMessage,
      },
    ]);
  };

  const handleCreateFileEntry = (directory: string, name: string, isDirectory: boolean) => {
    if (mode === 'live') {
      if (isDirectory) {
        void dispatchClientServerAction(
          activeServerDetail.uuidShort,
          'files/create-folder',
          'POST',
          { root: directory, name },
        ).catch((err) => notifyLiveDispatchError('Create folder', err));
      } else {
        const targetPath = `${directory === '/' ? '' : directory}/${name}`;
        void saveServerFileContentApi(activeServerDetail.uuidShort, targetPath, '').catch((err) =>
          notifyLiveDispatchError('Create file', err),
        );
      }
      return;
    }

    const cleanDir = directory === '/' ? '' : directory;
    const fullPath = `${cleanDir}/${name}`;
    const newEntry: CalagopusFileEntry = {
      id: `file-${Date.now()}`,
      path: fullPath,
      directory,
      name,
      isDirectory,
      sizeBytes: isDirectory ? 4096 : 0,
      modifiedAt: 'Just now',
      modifiedEpoch: Math.floor(Date.now() / 1000),
      permissions: isDirectory ? 'drwxr-xr-x' : '-rw-r--r--',
      mimeType: isDirectory ? 'inode/directory' : 'text/plain',
      content: isDirectory ? undefined : '',
    };
    setServerFiles((prev) => [...prev, newEntry]);
    appendActivity('server:file.create', `Created ${isDirectory ? 'folder' : 'file'} ${fullPath}.`);
  };

  const handleUploadFiles = (directory: string, uploadedFiles: File[]) => {
    if (mode === 'live') {
      void uploadServerFilesApi(activeServerDetail.uuidShort, directory, uploadedFiles).catch((err) => {
        notifyLiveDispatchError('File upload', err);
      });
      return;
    }

    const cleanDir = directory === '/' ? '' : directory;
    const timestamp = Math.floor(Date.now() / 1000);

    uploadedFiles.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        const textContent = typeof reader.result === 'string' ? reader.result : '';
        const newEntry: CalagopusFileEntry = {
          id: `file-up-${Date.now()}-${idx}`,
          path: `${cleanDir}/${file.name}`,
          directory,
          name: file.name,
          isDirectory: false,
          sizeBytes: file.size || new Blob([textContent]).size,
          modifiedAt: 'Just now',
          modifiedEpoch: timestamp,
          permissions: '-rw-r--r--',
          mimeType: file.type || 'text/plain',
          content: textContent,
        };
        setServerFiles((prev) => [
          ...prev.filter((f) => !(f.directory === directory && f.name === file.name)),
          newEntry,
        ]);
      };
      reader.onerror = () => {
        showToast({
          title: 'File read failed',
          message: `Unable to read "${file.name}" from disk.`,
          tone: 'error',
        });
      };
      reader.readAsText(file);
    });
    appendActivity(
      'server:file.upload',
      `Uploaded ${uploadedFiles.length} file(s) to ${directory} on ${activeServerDetail.name}.`,
    );
  };

  const handleSaveFileContent = (fileId: string, nextContent: string) => {
    const target = serverFiles.find((f) => f.id === fileId);
    if (mode === 'live' && target) {
      void saveServerFileContentApi(activeServerDetail.uuidShort, target.path, nextContent).catch(
        (err) => notifyLiveDispatchError('Save file', err),
      );
      return;
    }
    setServerFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? {
              ...f,
              content: nextContent,
              sizeBytes: new Blob([nextContent]).size,
              modifiedAt: 'Just now',
              modifiedEpoch: Math.floor(Date.now() / 1000),
            }
          : f,
      ),
    );
    appendActivity('server:file.write', `Saved file edits on ${activeServerDetail.name}.`);
  };

  const handleRenameFileEntry = (fileId: string, nextName: string) => {
    const target = serverFiles.find((f) => f.id === fileId);
    if (mode === 'live' && target) {
      void dispatchClientServerAction(activeServerDetail.uuidShort, 'files/rename', 'PUT', {
        root: target.directory,
        files: [{ from: target.name, to: nextName }],
      }).catch((err) => notifyLiveDispatchError('Rename entry', err));
      return;
    }
    setServerFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const prefix = f.directory === '/' ? '' : f.directory;
        return {
          ...f,
          name: nextName,
          path: `${prefix}/${nextName}`,
          modifiedAt: 'Just now',
        };
      }),
    );
  };

  const handleUpdatePermissions = (fileId: string, nextPermissions: string) => {
    const target = serverFiles.find((f) => f.id === fileId);
    if (mode === 'live' && target) {
      void dispatchClientServerAction(activeServerDetail.uuidShort, 'files/chmod', 'POST', {
        root: target.directory,
        files: [{ file: target.name, mode: nextPermissions }],
      }).catch((err) => notifyLiveDispatchError('Update file mode', err));
      return;
    }
    setServerFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, permissions: nextPermissions } : f)),
    );
  };

  const handleDeleteFileEntries = (fileIds: readonly string[]) => {
    const targets = serverFiles.filter((f) => fileIds.includes(f.id));
    if (mode === 'live' && targets.length > 0) {
      void dispatchClientServerAction(activeServerDetail.uuidShort, 'files/delete', 'POST', {
        root: targets[0].directory,
        files: targets.map((t) => t.name),
      }).catch((err) => notifyLiveDispatchError('Delete entries', err));
      return;
    }
    const idSet = new Set(fileIds);
    setServerFiles((prev) => prev.filter((f) => !idSet.has(f.id)));
    appendActivity(
      'server:file.delete',
      `Deleted ${fileIds.length} filesystem item(s) from ${activeServerDetail.name}.`,
      'warning',
    );
  };

  const handleCreateDatabase = (input: { name: string; connectionsFrom: string }) => {
    if (mode === 'live') {
      void dispatchClientServerAction(activeServerDetail.uuidShort, 'databases', 'POST', {
        database: input.name,
        remote: input.connectionsFrom,
      }).catch((err) => notifyLiveDispatchError('Create database', err));
      return;
    }

    const suffix = cryptoRandomToken(8);
    const created: CalagopusDatabaseRecord = {
      id: `db-${Date.now()}`,
      serverId: activeServerDetail.uuidShort,
      name: input.name,
      username: `u_${input.name.slice(0, 10)}`,
      host: `db-${activeServerDetail.node}.petalnodes.internal`,
      port: 3306,
      connectionsFrom: input.connectionsFrom,
      maxConnections: 25,
      password: `pn_db_${suffix}`,
    };
    setDatabases((prev) => [created, ...prev]);
    appendActivity('server:database.create', `Provisioned database ${input.name}.`);
  };

  const handleRotateDatabasePassword = (databaseId: string) => {
    if (mode === 'live') {
      void dispatchClientServerAction(
        activeServerDetail.uuidShort,
        `databases/${encodeURIComponent(databaseId)}/rotate-password`,
        'POST',
      ).catch((err) => notifyLiveDispatchError('Rotate database password', err));
      return;
    }
    const nextPass = `pn_db_${cryptoRandomToken(12)}`;
    setDatabases((prev) =>
      prev.map((d) => (d.id === databaseId ? { ...d, password: nextPass } : d)),
    );
    appendActivity('server:database.rotate-password', `Rotated password for database ${databaseId}.`);
  };

  const handleDeleteDatabase = (databaseId: string) => {
    if (mode === 'live') {
      void dispatchClientServerAction(
        activeServerDetail.uuidShort,
        `databases/${encodeURIComponent(databaseId)}`,
        'DELETE',
      ).catch((err) => notifyLiveDispatchError('Delete database', err));
      return;
    }
    setDatabases((prev) => prev.filter((d) => d.id !== databaseId));
    appendActivity('server:database.delete', `Dropped database ${databaseId}.`, 'warning');
  };

  const handleCreateBackup = (input: { name: string; ignoredFiles: string; isLocked: boolean }) => {
    if (mode === 'live') {
      void dispatchClientServerAction(activeServerDetail.uuidShort, 'backups', 'POST', {
        name: input.name,
        ignored: input.ignoredFiles,
        is_locked: input.isLocked,
      }).catch((err) => notifyLiveDispatchError('Create backup', err));
      return;
    }
    const shortId = cryptoRandomToken(8).toLowerCase();
    const created: CalagopusBackupRecord = {
      id: `bkp-${Date.now()}`,
      uuidShort: shortId,
      serverId: activeServerDetail.uuidShort,
      name: input.name,
      checksum: `sha256:${shortId}...${shortId.slice(0, 4)}`,
      bytes: 1610612736,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      isLocked: input.isLocked,
      isSuccessful: true,
      ignoredFiles: input.ignoredFiles,
    };
    setBackups((prev) => [created, ...prev]);
    appendActivity('server:backup.create', `Created backup snapshot "${input.name}".`);
  };

  const handleToggleBackupLock = (backupId: string) => {
    if (mode === 'live') {
      void dispatchClientServerAction(
        activeServerDetail.uuidShort,
        `backups/${encodeURIComponent(backupId)}/lock`,
        'POST',
      ).catch((err) => notifyLiveDispatchError('Toggle backup lock', err));
      return;
    }
    setBackups((prev) =>
      prev.map((b) => (b.id === backupId ? { ...b, isLocked: !b.isLocked } : b)),
    );
  };

  const handleRestoreBackup = (backupId: string) => {
    if (mode === 'live') {
      void dispatchClientServerAction(
        activeServerDetail.uuidShort,
        `backups/${encodeURIComponent(backupId)}/restore`,
        'POST',
      ).catch((err) => notifyLiveDispatchError('Restore backup', err));
      return;
    }
    appendActivity('server:backup.restore', `Initiated restore from backup ${backupId}.`, 'warning');
  };

  const handleDeleteBackup = (backupId: string) => {
    if (mode === 'live') {
      void dispatchClientServerAction(
        activeServerDetail.uuidShort,
        `backups/${encodeURIComponent(backupId)}`,
        'DELETE',
      ).catch((err) => notifyLiveDispatchError('Delete backup', err));
      return;
    }
    setBackups((prev) => prev.filter((b) => b.id !== backupId));
    appendActivity('server:backup.delete', `Deleted backup snapshot ${backupId}.`, 'warning');
  };

  const handleCreateSchedule = (input: {
    name: string;
    minute: string;
    hour: string;
    dayOfMonth: string;
    month: string;
    dayOfWeek: string;
    onlyWhenOnline: boolean;
    taskAction: CalagopusScheduleTask['action'];
    taskPayload: string;
  }) => {
    if (mode === 'live') {
      void dispatchClientServerAction(activeServerDetail.uuidShort, 'schedules', 'POST', {
        name: input.name,
        minute: input.minute,
        hour: input.hour,
        day_of_month: input.dayOfMonth,
        month: input.month,
        day_of_week: input.dayOfWeek,
        only_when_online: input.onlyWhenOnline,
        is_active: true,
      }).catch((err) => notifyLiveDispatchError('Create schedule', err));
      return;
    }
    const created: CalagopusScheduleRecord = {
      id: `sch-${Date.now()}`,
      serverId: activeServerDetail.uuidShort,
      name: input.name,
      minute: input.minute,
      hour: input.hour,
      dayOfMonth: input.dayOfMonth,
      month: input.month,
      dayOfWeek: input.dayOfWeek,
      isActive: true,
      onlyWhenOnline: input.onlyWhenOnline,
      lastRunAt: null,
      nextRunAt: 'Scheduled next interval',
      tasks: [
        {
          id: `tsk-${Date.now()}`,
          sequenceId: 1,
          action: input.taskAction,
          payload: input.taskPayload,
          timeOffsetSeconds: 0,
        },
      ],
    };
    setSchedules((prev) => [created, ...prev]);
    appendActivity('server:schedule.create', `Created schedule "${input.name}".`);
  };

  const handleToggleScheduleActive = (scheduleId: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === scheduleId ? { ...s, isActive: !s.isActive } : s)),
    );
  };

  const handleRunScheduleNow = (scheduleId: string) => {
    if (mode === 'live') {
      void dispatchClientServerAction(
        activeServerDetail.uuidShort,
        `schedules/${encodeURIComponent(scheduleId)}/execute`,
        'POST',
      ).catch((err) => notifyLiveDispatchError('Run schedule', err));
      return;
    }
    const nowStamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setSchedules((prev) =>
      prev.map((s) => (s.id === scheduleId ? { ...s, lastRunAt: nowStamp } : s)),
    );
    appendActivity('server:schedule.execute', `Manually triggered schedule ${scheduleId}.`);
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (mode === 'live') {
      void dispatchClientServerAction(
        activeServerDetail.uuidShort,
        `schedules/${encodeURIComponent(scheduleId)}`,
        'DELETE',
      ).catch((err) => notifyLiveDispatchError('Delete schedule', err));
      return;
    }
    setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    appendActivity('server:schedule.delete', `Removed schedule ${scheduleId}.`, 'warning');
  };

  const handleSetPrimaryAllocation = (allocationId: string) => {
    if (mode === 'live') {
      void dispatchClientServerAction(
        activeServerDetail.uuidShort,
        `network/allocations/${encodeURIComponent(allocationId)}/primary`,
        'POST',
      ).catch((err) => notifyLiveDispatchError('Set primary allocation', err));
      return;
    }
    setAllocations((prev) => {
      const target = prev.find((a) => a.id === allocationId);
      if (target) {
        setServerDetailsMap((detailsPrev) => ({
          ...detailsPrev,
          [activeServerDetail.uuidShort]: {
            ...activeServerDetail,
            allocation: `${target.ip}:${target.port}`,
          },
        }));
      }
      return prev.map((a) =>
        a.serverId === activeServerDetail.uuidShort
          ? { ...a, isPrimary: a.id === allocationId }
          : a,
      );
    });
  };

  const handleUpdateAllocationNotes = (allocationId: string, notes: string) => {
    if (mode === 'live') {
      void dispatchClientServerAction(
        activeServerDetail.uuidShort,
        `network/allocations/${encodeURIComponent(allocationId)}`,
        'POST',
        { notes },
      ).catch((err) => notifyLiveDispatchError('Update allocation notes', err));
      return;
    }
    setAllocations((prev) =>
      prev.map((a) => (a.id === allocationId ? { ...a, notes } : a)),
    );
  };

  const handleAllocatePort = () => {
    if (mode === 'live') {
      void dispatchClientServerAction(
        activeServerDetail.uuidShort,
        'network/allocations',
        'POST',
      ).catch((err) => notifyLiveDispatchError('Allocate port', err));
      return;
    }
    const maxPort = activeServerAllocations.reduce((m, a) => Math.max(m, a.port), 25565);
    const created: CalagopusAllocationRecord = {
      id: `alloc-${Date.now()}`,
      serverId: activeServerDetail.uuidShort,
      ip: activeServerAllocations[0]?.ip ?? '198.51.100.14',
      alias: '',
      port: maxPort + 1,
      notes: 'Additional UDP/TCP listener',
      isPrimary: false,
    };
    setAllocations((prev) => [...prev, created]);
    appendActivity('server:allocation.create', `Allocated port ${created.port} on ${activeServerDetail.name}.`);
  };

  const handleRemoveAllocation = (allocationId: string) => {
    if (mode === 'live') {
      void dispatchClientServerAction(
        activeServerDetail.uuidShort,
        `network/allocations/${encodeURIComponent(allocationId)}`,
        'DELETE',
      ).catch((err) => notifyLiveDispatchError('Remove allocation', err));
      return;
    }
    setAllocations((prev) => prev.filter((a) => a.id !== allocationId));
    appendActivity('server:allocation.delete', `Released allocation ${allocationId}.`, 'warning');
  };

  const handleUpdateDockerImage = (dockerImage: string) => {
    if (mode === 'live') {
      void dispatchClientServerAction(
        activeServerDetail.uuidShort,
        'settings/docker-image',
        'PUT',
        { docker_image: dockerImage },
      ).catch((err) => notifyLiveDispatchError('Update Docker image', err));
      return;
    }
    setStartupConfigs((prev) => ({
      ...prev,
      [activeServerDetail.uuidShort]: {
        ...activeStartupConfig,
        dockerImage,
      },
    }));
    appendActivity('server:startup.image', `Updated Docker image to ${dockerImage}.`);
  };

  const handleUpdateStartupVariable = (envKey: string, value: string) => {
    if (mode === 'live') {
      void dispatchClientServerAction(activeServerDetail.uuidShort, 'startup/variable', 'PUT', {
        key: envKey,
        value,
      }).catch((err) => notifyLiveDispatchError('Update startup variable', err));
      return;
    }
    setStartupConfigs((prev) => ({
      ...prev,
      [activeServerDetail.uuidShort]: {
        ...activeStartupConfig,
        variables: activeStartupConfig.variables.map((v) =>
          v.envKey === envKey ? { ...v, value } : v,
        ),
      },
    }));
    appendActivity('server:startup.variable', `Updated ${envKey} on ${activeServerDetail.name}.`);
  };

  const handleInviteSubuser = (email: string, permissions: string[]) => {
    if (mode === 'live') {
      void dispatchClientServerAction(activeServerDetail.uuidShort, 'users', 'POST', {
        email,
        permissions,
      }).catch((err) => notifyLiveDispatchError('Invite subuser', err));
      return;
    }
    const created: CalagopusSubuserRecord = {
      id: `sub-${Date.now()}`,
      serverId: activeServerDetail.uuidShort,
      username: email.split('@')[0] ?? 'collaborator',
      email,
      permissions,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setSubusers((prev) => [created, ...prev]);
    appendActivity('server:subuser.create', `Invited subuser ${email} to ${activeServerDetail.name}.`);
  };

  const handleUpdateSubuserPermissions = (subuserId: string, permissions: string[]) => {
    if (mode === 'live') {
      void dispatchClientServerAction(
        activeServerDetail.uuidShort,
        `users/${encodeURIComponent(subuserId)}`,
        'POST',
        { permissions },
      ).catch((err) => notifyLiveDispatchError('Update subuser permissions', err));
      return;
    }
    setSubusers((prev) =>
      prev.map((u) => (u.id === subuserId ? { ...u, permissions } : u)),
    );
  };

  const handleRemoveSubuser = (subuserId: string) => {
    if (mode === 'live') {
      void dispatchClientServerAction(
        activeServerDetail.uuidShort,
        `users/${encodeURIComponent(subuserId)}`,
        'DELETE',
      ).catch((err) => notifyLiveDispatchError('Remove subuser', err));
      return;
    }
    setSubusers((prev) => prev.filter((u) => u.id !== subuserId));
    appendActivity('server:subuser.delete', `Revoked subuser ${subuserId}.`, 'warning');
  };

  const handleRenameServer = (name: string, description: string) => {
    if (mode === 'live') {
      void dispatchClientServerAction(activeServerDetail.uuidShort, 'settings/rename', 'POST', {
        name,
        description,
      }).catch((err) => notifyLiveDispatchError('Rename server', err));
      return;
    }
    setServerDetailsMap((prev) => ({
      ...prev,
      [activeServerDetail.uuidShort]: {
        ...activeServerDetail,
        name,
        description,
      },
    }));
    appendActivity('server:settings.rename', `Renamed server ${activeServerDetail.uuidShort} to "${name}".`);
  };

  const handleReinstallServer = () => {
    if (mode === 'live') {
      void dispatchClientServerAction(
        activeServerDetail.uuidShort,
        'settings/reinstall',
        'POST',
      ).catch((err) => notifyLiveDispatchError('Reinstall server', err));
      return;
    }
    const nowTime = new Date().toTimeString().slice(0, 8);
    setConsoleLogs((prev) => [
      ...prev,
      {
        id: `log-reinstall-${Date.now()}`,
        timestamp: nowTime,
        level: 'WARN',
        source: 'WingsInstaller',
        message: `Running egg installer script for ${activeServerDetail.name}...`,
      },
    ]);
    appendActivity('server:settings.reinstall', `Triggered container reinstall for ${activeServerDetail.name}.`, 'warning');
  };

  const handleCreateApiKey = (input: {
    description: string;
    allowedIps: string[];
    permissions: string[];
  }) => {
    const suffix = cryptoRandomToken(6).toUpperCase();
    const identifier = `ptlc_01${suffix}`;
    const secretToken = `${identifier}_${cryptoRandomToken(16)}`;
    const newKey: CalagopusApiKey = {
      id: `key-${Date.now()}`,
      identifier,
      description: input.description,
      allowedIps: input.allowedIps,
      permissions: input.permissions,
      lastUsedAt: null,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setApiKeys((prev) => [newKey, ...prev]);
    appendActivity('account:api-key.create', `Issued client API key "${input.description}".`);
    return { key: newKey, secretToken };
  };

  const handleRevokeApiKey = (keyId: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
    appendActivity('account:api-key.delete', `Revoked API key ${keyId}.`, 'warning');
  };

  const handleAddSshKey = (input: { name: string; publicKey: string }) => {
    const fpHash = btoa(input.publicKey).slice(0, 32).replace(/[^a-zA-Z0-9]/g, 'x');
    const created: CalagopusSshKeyRecord = {
      id: `ssh-${Date.now()}`,
      name: input.name,
      fingerprint: `SHA256:${fpHash}`,
      publicKeyPreview: `${input.publicKey.slice(0, 44)}...`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setSshKeys((prev) => [created, ...prev]);
    appendActivity('account:ssh-key.create', `Added SSH key "${input.name}".`);
  };

  const handleDeleteSshKey = (keyId: string) => {
    setSshKeys((prev) => prev.filter((k) => k.id !== keyId));
    appendActivity('account:ssh-key.delete', `Removed SSH key ${keyId}.`, 'warning');
  };

  const handleUpdateProfile = (input: { username: string; email: string }) => {
    if (isAdminRole) {
      setAdminProfile((prev) => ({ ...prev, ...input }));
    } else {
      setMemberProfile((prev) => ({ ...prev, ...input }));
    }
    appendActivity('account:profile.update', `Updated Petalnodes profile (${input.username}).`);
  };

  const handleUpdatePreferences = (next: PetalnodesUiPreferences) => {
    setUiPreferences(next);
    try {
      window.localStorage.setItem(UI_PREFS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors in restricted environments.
    }
  };

  if (scope === 'auth') {
    return (
      <AuthShell
        title={`Sign in to ${PETALNODES_BRAND}`}
        subtitle="Authenticate to manage your Petalnodes servers, files, and console."
        footer={
          <button
            type="button"
            onClick={() => setCurrentPath('/')}
            className="blush-focus-ring rounded px-2 py-1 font-medium text-[#8E2E52] hover:underline cursor-pointer"
          >
            Return to dashboard
          </button>
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!authEmail.trim() || !authPassword.trim()) {
              setAuthError('Enter both your username/email and password to sign in.');
              return;
            }
            setAuthError(null);
            setAuthPassword('');
            setCurrentPath('/');
          }}
        >
          <TextInput
            label="Username or Email"
            required
            value={authEmail}
            onChange={(e) => {
              setAuthEmail(e.currentTarget.value);
              setAuthError(null);
            }}
          />
          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            required
            value={authPassword}
            error={authError ?? undefined}
            onChange={(e) => {
              setAuthPassword(e.currentTarget.value);
              setAuthError(null);
            }}
          />
          <Button type="submit" variant="primary" className="w-full">
            Sign In
          </Button>
        </form>
      </AuthShell>
    );
  }

  const serverDatabases = databases.filter((d) => d.serverId === activeServerDetail.uuidShort);
  const serverBackups = backups.filter((b) => b.serverId === activeServerDetail.uuidShort);
  const serverSchedules = schedules.filter((s) => s.serverId === activeServerDetail.uuidShort);
  const serverSubusers = subusers.filter((u) => u.serverId === activeServerDetail.uuidShort);

  const renderMainContent = () => {
    if (currentPath === '/') {
      return (
        <ClientDashboardPage
          user={user}
          data={resolvedClientData}
          loading={isLoading}
          error={errorMessage}
          onRetry={() => (mode === 'live' ? void loadLiveApi() : setMode('fixture'))}
          onNavigate={setCurrentPath}
          dataSourceLabel={dataSourceLabel}
          compact={uiPreferences.compactTableRows}
        />
      );
    }

    if (currentPath === '/admin') {
      return (
        <AdminDashboardPage
          user={user}
          data={resolvedAdminData}
          loading={isLoading}
          error={errorMessage}
          onRetry={() => (mode === 'live' ? void loadLiveApi() : setMode('fixture'))}
          onNavigate={setCurrentPath}
          dataSourceLabel={dataSourceLabel}
          compact={uiPreferences.compactTableRows}
        />
      );
    }

    if (currentPath.startsWith('/admin/')) {
      return (
        <AdminResourcesPage
          currentPath={currentPath}
          user={user}
          nodes={mode === 'empty' ? [] : SANDBOX_ADMIN_NODES}
          extensions={mode === 'empty' ? [] : SANDBOX_ADMIN_EXTENSIONS}
          servers={mode === 'empty' ? [] : allFixtureServers}
          auditLogs={mode === 'empty' ? [] : SANDBOX_ADMIN_FIXTURE.auditLogs}
          onNavigate={setCurrentPath}
          compact={uiPreferences.compactTableRows}
        />
      );
    }

    if (currentPath === '/account') {
      return (
        <AccountProfilePage
          user={user}
          preferences={uiPreferences}
          onUpdateProfile={handleUpdateProfile}
          onUpdatePreferences={handleUpdatePreferences}
        />
      );
    }

    if (currentPath === '/account/security') {
      return (
        <AccountSecurityPage
          twoFactorEnabled={twoFactorEnabled}
          totpSetupKey={mode === 'fixture' ? 'PREVIEW-ONLY-2FA-SETUP-KEY' : undefined}
          onUpdatePassword={() =>
            appendActivity('account:security.password', 'Updated Petalnodes account password.')
          }
          onToggleTwoFactor={(enabled) => {
            setTwoFactorEnabled(enabled);
            appendActivity(
              enabled ? 'account:security.2fa.enable' : 'account:security.2fa.disable',
              `${enabled ? 'Enabled' : 'Disabled'} TOTP two-factor authentication.`,
              enabled ? 'completed' : 'warning',
            );
          }}
        />
      );
    }

    if (currentPath === '/account/api-keys') {
      return (
        <AccountApiKeysPage
          apiKeys={apiKeys}
          onCreateKey={handleCreateApiKey}
          onRevokeKey={handleRevokeApiKey}
          compact={uiPreferences.compactTableRows}
          confirmDestructive={uiPreferences.confirmDestructiveActions}
        />
      );
    }

    if (currentPath === '/account/ssh-keys') {
      return (
        <AccountSshKeysPage
          sshKeys={sshKeys}
          onAddSshKey={handleAddSshKey}
          onDeleteSshKey={handleDeleteSshKey}
          compact={uiPreferences.compactTableRows}
          confirmDestructive={uiPreferences.confirmDestructiveActions}
        />
      );
    }

    if (currentPath === '/account/activity') {
      return (
        <ActivityLogPage
          title="Account Activity"
          description="Authentication events, API key changes, and actions triggered under your account."
          entries={activityEntries}
          compact={uiPreferences.compactTableRows}
        />
      );
    }

    if (parsedServer) {
      switch (parsedServer.subRoute) {
        case 'overview':
          return (
            <ServerOverviewPage
              server={activeServerDetail}
              onPowerAction={handleServerPowerAction}
              onNavigate={setCurrentPath}
              confirmDestructive={uiPreferences.confirmDestructiveActions}
            />
          );
        case 'console':
        case 'terminal':
          return (
            <ServerConsolePage
              server={activeServerDetail}
              logs={consoleLogs}
              onSendCommand={handleSendConsoleCommand}
              onClearLogs={() => setConsoleLogs([])}
              onPowerAction={handleServerPowerAction}
              defaultAutoScroll={uiPreferences.consoleAutoScrollDefault}
              confirmDestructive={uiPreferences.confirmDestructiveActions}
            />
          );
        case 'files':
          return (
            <ServerFilesPage
              server={activeServerDetail}
              files={serverFiles}
              onCreateEntry={handleCreateFileEntry}
              onSaveFileContent={handleSaveFileContent}
              onRenameEntry={handleRenameFileEntry}
              onUpdatePermissions={handleUpdatePermissions}
              onDeleteEntries={handleDeleteFileEntries}
              onUploadFiles={handleUploadFiles}
              compact={uiPreferences.compactTableRows}
              confirmDestructive={uiPreferences.confirmDestructiveActions}
            />
          );
        case 'databases':
          return (
            <ServerDatabasesPage
              server={activeServerDetail}
              databases={serverDatabases}
              onCreateDatabase={handleCreateDatabase}
              onRotatePassword={handleRotateDatabasePassword}
              onDeleteDatabase={handleDeleteDatabase}
              compact={uiPreferences.compactTableRows}
              confirmDestructive={uiPreferences.confirmDestructiveActions}
            />
          );
        case 'backups':
          return (
            <ServerBackupsPage
              server={activeServerDetail}
              backups={serverBackups}
              onCreateBackup={handleCreateBackup}
              onToggleLock={handleToggleBackupLock}
              onRestoreBackup={handleRestoreBackup}
              onDeleteBackup={handleDeleteBackup}
              compact={uiPreferences.compactTableRows}
              confirmDestructive={uiPreferences.confirmDestructiveActions}
            />
          );
        case 'schedules':
          return (
            <ServerSchedulesPage
              server={activeServerDetail}
              schedules={serverSchedules}
              onCreateSchedule={handleCreateSchedule}
              onToggleScheduleActive={handleToggleScheduleActive}
              onRunScheduleNow={handleRunScheduleNow}
              onDeleteSchedule={handleDeleteSchedule}
              confirmDestructive={uiPreferences.confirmDestructiveActions}
            />
          );
        case 'network':
          return (
            <ServerNetworkPage
              server={activeServerDetail}
              allocations={activeServerAllocations}
              onSetPrimary={handleSetPrimaryAllocation}
              onUpdateNotes={handleUpdateAllocationNotes}
              onAllocatePort={handleAllocatePort}
              onRemoveAllocation={handleRemoveAllocation}
              compact={uiPreferences.compactTableRows}
              confirmDestructive={uiPreferences.confirmDestructiveActions}
            />
          );
        case 'startup':
          return (
            <ServerStartupPage
              server={activeServerDetail}
              startup={activeStartupConfig}
              onUpdateDockerImage={handleUpdateDockerImage}
              onUpdateVariable={handleUpdateStartupVariable}
            />
          );
        case 'users':
          return (
            <ServerUsersPage
              server={activeServerDetail}
              subusers={serverSubusers}
              onInviteSubuser={handleInviteSubuser}
              onUpdateSubuserPermissions={handleUpdateSubuserPermissions}
              onRemoveSubuser={handleRemoveSubuser}
              compact={uiPreferences.compactTableRows}
              confirmDestructive={uiPreferences.confirmDestructiveActions}
            />
          );
        case 'settings':
          return (
            <ServerSettingsPage
              server={activeServerDetail}
              onRenameServer={handleRenameServer}
              onReinstallServer={handleReinstallServer}
            />
          );
        case 'activity':
          return (
            <ActivityLogPage
              title="Server Activity"
              description={`Recent power signals, file edits, backups, and access events for ${activeServerDetail.name}.`}
              entries={activityEntries}
              compact={uiPreferences.compactTableRows}
            />
          );
        default:
          break;
      }
    }

    return (
      <div className="space-y-6">
        <PageHeader
          title="Page Not Found"
          description={`No Calagopus module is registered for route "${currentPath}".`}
          actions={
            <Button variant="primary" size="sm" onClick={() => setCurrentPath('/')}>
              Return to Servers
            </Button>
          }
        />
        <ErrorState
          title="Route not found"
          description={`The path "${currentPath}" does not match any active Petalnodes / Calagopus view.`}
          retryLabel="Open Workspace"
          onRetry={() => setCurrentPath('/')}
        />
      </div>
    );
  };

  const shellServers = resolvedClientData?.servers ?? [];
  const shellActiveServerData =
    shellServers.find((s) => s.uuidShort === activeServerDetail.uuidShort) ?? shellServers[0];

  return (
    <AppShell
      currentPath={currentPath}
      serverLabel={shellActiveServerData?.name ?? 'No Server'}
      user={user}
      onNavigate={setCurrentPath}
      onSignOut={() => {
        setCurrentPath('/auth/login');
        showToast({ title: 'Signed out', tone: 'info' });
      }}
      activeServer={
        shellActiveServerData
          ? {
              uuidShort: shellActiveServerData.uuidShort,
              name: shellActiveServerData.name,
              state: shellActiveServerData.state,
              uptimeSeconds: serverDetailsMap[shellActiveServerData.uuidShort]?.uptimeSeconds,
            }
          : undefined
      }
      serversList={shellServers.map((s) => ({
        uuidShort: s.uuidShort,
        name: s.name,
        node: s.node,
      }))}
      onServerPowerAction={handleServerPowerAction}
      headerRightSlot={
        <DropdownMenu
          label="Dashboard Verification"
          trigger={
            <Button
              variant="secondary"
              size="sm"
              aria-label={`Verification mode: ${dataSourceLabel}`}
              leftIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}
            >
              <span className="hidden xl:inline">{dataSourceLabel}</span>
            </Button>
          }
          items={[
            {
              id: 'mode-fixture',
              label: 'Preview Fixture Data',
              onSelect: () => setMode('fixture'),
            },
            {
              id: 'mode-live',
              label: 'Fetch Live Panel API',
              onSelect: () => setMode('live'),
            },
            {
              id: 'mode-loading',
              label: 'Inspect Loading State',
              onSelect: () => setMode('loading'),
            },
            {
              id: 'mode-empty',
              label: 'Inspect Empty State',
              onSelect: () => setMode('empty'),
            },
            {
              id: 'mode-error',
              label: 'Inspect Error State',
              onSelect: () => setMode('error'),
            },
            {
              id: 'toggle-role',
              label: isAdminRole ? 'Switch to Member Role' : 'Switch to Admin Role',
              onSelect: () => {
                setIsAdminRole((prev) => !prev);
                if (isAdminRole && currentPath.startsWith('/admin')) {
                  setCurrentPath('/');
                }
              },
            },
          ]}
        />
      }
    >
      {renderMainContent()}
    </AppShell>
  );
}

export default function App() {
  return (
    <MantineProvider theme={blushMantineTheme} cssVariablesResolver={blushCssVariablesResolver}>
      <Notifications position="top-right" zIndex={1000} />
      <DashboardVerificationHost />
    </MantineProvider>
  );
}
