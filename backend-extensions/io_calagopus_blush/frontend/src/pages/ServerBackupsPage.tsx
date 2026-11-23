import React from 'react';
import {
  Archive,
  Download,
  Lock,
  LockOpen,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { formatBytes, type CalagopusServerDetail } from '../api/calagopusCore';
import {
  computeBackupStorageBytes,
  filterRecordsByText,
  validateBackupName,
  type CalagopusBackupRecord,
} from '../api/calagopusModules';
import { Button } from '../components/Button';
import { DataTable, type TableColumn } from '../components/DataTable';
import { EmptyState } from '../components/FeedbackStates';
import { Checkbox, SearchField, Textarea, TextInput } from '../components/FormControls';
import { ConfirmDialog, ModalDialog, showToast } from '../components/Overlays';
import { Card, PageHeader, StatusBadge } from '../components/Surface';

export interface ServerBackupsPageProps {
  server: CalagopusServerDetail;
  backups: readonly CalagopusBackupRecord[];
  onCreateBackup: (input: { name: string; ignoredFiles: string; isLocked: boolean }) => void;
  onToggleLock: (backupId: string) => void;
  onRestoreBackup: (backupId: string) => void;
  onDeleteBackup: (backupId: string) => void;
  compact?: boolean;
  confirmDestructive?: boolean;
}

export function ServerBackupsPage({
  server,
  backups,
  onCreateBackup,
  onToggleLock,
  onRestoreBackup,
  onDeleteBackup,
  compact = false,
  confirmDestructive = true,
}: ServerBackupsPageProps) {
  const [query, setQuery] = React.useState('');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [backupName, setBackupName] = React.useState('');
  const [ignoredFiles, setIgnoredFiles] = React.useState('logs/*.gz, .cache/*');
  const [isLocked, setIsLocked] = React.useState(false);
  const [nameError, setNameError] = React.useState<string | null>(null);

  const [restoreTarget, setRestoreTarget] = React.useState<CalagopusBackupRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<CalagopusBackupRecord | null>(null);

  const filtered = React.useMemo(
    () => filterRecordsByText(backups, query, (b) => [b.name, b.uuidShort, b.checksum]),
    [backups, query],
  );

  const totalBytes = computeBackupStorageBytes(backups);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateBackupName(backupName);
    if (err) {
      setNameError(err);
      return;
    }
    onCreateBackup({
      name: backupName.trim(),
      ignoredFiles: ignoredFiles.trim(),
      isLocked,
    });
    showToast({
      title: 'Backup created',
      message: `Snapshot "${backupName.trim()}" queued and stored.`,
      tone: 'success',
    });
    setCreateOpen(false);
    setBackupName('');
    setIsLocked(false);
    setNameError(null);
  };

  const columns: readonly TableColumn<CalagopusBackupRecord>[] = [
    {
      key: 'name',
      header: 'Backup',
      render: (b) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#29232A]">{b.name}</span>
            {b.isLocked ? <StatusBadge tone="pink" label="Locked" showIcon={false} /> : null}
          </div>
          <p className="font-mono text-[12px] text-[#777078]">
            {b.uuidShort} · {b.checksum}
          </p>
        </div>
      ),
    },
    {
      key: 'bytes',
      header: 'Size',
      align: 'right',
      numeric: true,
      render: (b) => formatBytes(b.bytes),
    },
    {
      key: 'createdAt',
      header: 'Created',
      numeric: true,
    },
    {
      key: 'isSuccessful',
      header: 'Status',
      render: (b) => (
        <StatusBadge
          tone={b.isSuccessful ? 'success' : 'danger'}
          label={b.isSuccessful ? 'Verified' : 'Failed'}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backups"
        description={`Create, lock, download, or restore point-in-time archives for ${server.name}.`}
        metadata={[`${backups.length} snapshots`, `${formatBytes(totalBytes)} total`]}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setCreateOpen(true)}
          >
            Create Backup
          </Button>
        }
      />

      <Card
        title="Backup Archives"
        description="Locked backups are protected from accidental deletion or rotation."
        headerAction={
          <div className="w-full sm:w-64">
            <SearchField
              aria-label="Filter backups"
              placeholder="Search backups..."
              value={query}
              onChange={setQuery}
            />
          </div>
        }
      >
        <DataTable
          caption="Server Backups"
          columns={columns}
          rows={filtered}
          compact={compact}
          renderActions={(b) => (
            <div className="inline-flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                aria-label={b.isLocked ? `Unlock ${b.name}` : `Lock ${b.name}`}
                leftIcon={
                  b.isLocked ? <LockOpen className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />
                }
                onClick={() => {
                  onToggleLock(b.id);
                  showToast({
                    title: b.isLocked ? 'Backup unlocked' : 'Backup locked',
                    message: b.name,
                    tone: 'info',
                  });
                }}
              >
                {b.isLocked ? 'Unlock' : 'Lock'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                onClick={() => {
                  if (confirmDestructive) {
                    setRestoreTarget(b);
                  } else {
                    onRestoreBackup(b.id);
                    showToast({
                      title: 'Backup restore initiated',
                      message: `Restoring ${b.name} onto ${server.name}.`,
                      tone: 'warning',
                    });
                  }
                }}
              >
                Restore
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Download ${b.name}`}
                leftIcon={<Download className="h-3.5 w-3.5" />}
                onClick={() =>
                  showToast({
                    title: 'Archive download ready',
                    message: `Requested signed download URL for ${b.uuidShort}.tar.gz`,
                    tone: 'success',
                  })
                }
              >
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={b.isLocked}
                aria-label={`Delete ${b.name}`}
                leftIcon={<Trash2 className="h-3.5 w-3.5 text-[#942B38]" />}
                onClick={() => {
                  if (confirmDestructive) {
                    setDeleteTarget(b);
                  } else {
                    onDeleteBackup(b.id);
                    showToast({
                      title: 'Backup deleted',
                      message: `${b.name} was removed.`,
                      tone: 'success',
                    });
                  }
                }}
              >
                Delete
              </Button>
            </div>
          )}
          emptyState={
            <EmptyState
              icon={<Archive className="h-5 w-5" />}
              title={query ? 'No matching backups' : 'No backups created yet'}
              description={
                query
                  ? `No backup snapshot matched "${query}".`
                  : 'Create a snapshot before applying plugin updates or configuration changes.'
              }
              actionLabel={query ? 'Clear Filter' : 'Create Backup'}
              onAction={() => (query ? setQuery('') : setCreateOpen(true))}
            />
          }
        />
      </Card>

      <ModalDialog
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Server Backup"
        description={`Snapshot container files from ${server.name}.`}
        size="sm"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <TextInput
            label="Backup Name"
            placeholder="e.g. Pre-1.21 Upgrade Snapshot"
            required
            value={backupName}
            error={nameError ?? undefined}
            onChange={(e) => {
              setBackupName(e.currentTarget.value);
              setNameError(null);
            }}
          />
          <Textarea
            label="Ignored Files & Directories"
            description="Glob patterns excluded from this archive (comma or newline separated)."
            value={ignoredFiles}
            onChange={(e) => setIgnoredFiles(e.currentTarget.value)}
          />
          <Checkbox
            label="Lock backup against automatic or manual deletion"
            checked={isLocked}
            onChange={(e) => setIsLocked(e.currentTarget.checked)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Backup
            </Button>
          </div>
        </form>
      </ModalDialog>

      <ConfirmDialog
        opened={restoreTarget !== null}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => {
          if (restoreTarget) {
            onRestoreBackup(restoreTarget.id);
            showToast({
              title: 'Backup restore initiated',
              message: `Restoring ${restoreTarget.name} onto ${server.name}.`,
              tone: 'warning',
            });
          }
          setRestoreTarget(null);
        }}
        title="Restore Server Backup"
        message={`Restore "${restoreTarget?.name}"? Existing files modified after ${restoreTarget?.createdAt} may be overwritten during restoration.`}
        confirmLabel="Restore Archive"
        destructive
      />

      <ConfirmDialog
        opened={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteBackup(deleteTarget.id);
            showToast({
              title: 'Backup deleted',
              message: `${deleteTarget.name} was removed.`,
              tone: 'success',
            });
          }
          setDeleteTarget(null);
        }}
        title="Delete Backup"
        message={`Permanently delete backup "${deleteTarget?.name}" (${deleteTarget?.uuidShort})?`}
        confirmLabel="Delete Backup"
        destructive
      />
    </div>
  );
}
