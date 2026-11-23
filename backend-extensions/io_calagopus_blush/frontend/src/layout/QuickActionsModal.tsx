import React from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { ModalDialog } from '../components/Overlays';
import { SearchField } from '../components/FormControls';
import {
  ADMIN_NAV_GROUPS,
  CLIENT_NAV_GROUPS,
  filterNavGroupsByPermissions,
  SERVER_NAV_GROUPS,
  type CalagopusUserContext,
} from '../navigation/calagopusRoutes';
import { NavIcon } from './NavIcon';

export interface QuickActionTarget {
  id: string;
  label: string;
  scopeLabel: string;
  path: string;
  icon: Parameters<typeof NavIcon>[0]['name'];
}

export interface QuickActionsModalProps {
  opened: boolean;
  onClose: () => void;
  user: CalagopusUserContext;
  activeServerId: string;
  servers: readonly { uuidShort: string; name: string; node: string }[];
  onNavigate: (path: string) => void;
}

export function QuickActionsModal({
  opened,
  onClose,
  user,
  activeServerId,
  servers,
  onNavigate,
}: QuickActionsModalProps) {
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    if (!opened) setQuery('');
  }, [opened]);

  const actions = React.useMemo<QuickActionTarget[]>(() => {
    const items: QuickActionTarget[] = [];

    for (const srv of servers) {
      items.push({
        id: `srv-goto-${srv.uuidShort}`,
        label: `Open ${srv.name} Console`,
        scopeLabel: `Server · ${srv.uuidShort}`,
        path: `/server/${srv.uuidShort}`,
        icon: 'terminal',
      });
    }

    const clientGroups = filterNavGroupsByPermissions(CLIENT_NAV_GROUPS, user);
    for (const group of clientGroups) {
      for (const item of group.items) {
        items.push({
          id: `client-${item.id}`,
          label: item.label,
          scopeLabel: `Workspace · ${group.label}`,
          path: item.path,
          icon: item.icon,
        });
      }
    }

    const targetServerId =
      activeServerId && servers.some((s) => s.uuidShort === activeServerId)
        ? activeServerId
        : servers[0]?.uuidShort;

    if (targetServerId) {
      const serverGroups = filterNavGroupsByPermissions(SERVER_NAV_GROUPS, user);
      for (const group of serverGroups) {
        for (const item of group.items) {
          items.push({
            id: `server-${item.id}`,
            label: `${item.label} (${targetServerId})`,
            scopeLabel: `Server · ${group.label}`,
            path: item.path.replace('/server/alpha-01', `/server/${targetServerId}`),
            icon: item.icon,
          });
        }
      }
    }

    const canAdmin = user.isAdmin || user.permissions.some((p) => p.startsWith('admin.'));
    if (canAdmin) {
      const adminGroups = filterNavGroupsByPermissions(ADMIN_NAV_GROUPS, user);
      for (const group of adminGroups) {
        for (const item of group.items) {
          items.push({
            id: `admin-${item.id}`,
            label: item.label,
            scopeLabel: `Admin · ${group.label}`,
            path: item.path,
            icon: item.icon,
          });
        }
      }
    }

    return items;
  }, [servers, user, activeServerId]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions.slice(0, 12);
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.scopeLabel.toLowerCase().includes(q) ||
        a.path.toLowerCase().includes(q),
    );
  }, [actions, query]);

  return (
    <ModalDialog
      opened={opened}
      onClose={onClose}
      title="Quick Actions"
      description="Jump directly to any server console, file manager, account, or admin route."
      size="md"
    >
      <div className="space-y-4">
        <SearchField
          aria-label="Search quick actions"
          placeholder="Search servers, routes, files, API keys..."
          value={query}
          onChange={setQuery}
        />

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#EEE5E9] bg-[#FCFAFB] px-4 py-8 text-center">
            <Search className="h-5 w-5 text-[#777078] mb-2" aria-hidden="true" />
            <p className="text-sm font-medium text-[#29232A]">No matching routes</p>
            <p className="mt-0.5 text-[12px] text-[#777078]">
              Try searching for Console, Files, API Keys, or Admin.
            </p>
          </div>
        ) : (
          <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-0.5">
            {filtered.map((action) => (
              <li key={action.id}>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate(action.path);
                    onClose();
                  }}
                  className="blush-transition blush-focus-ring flex w-full items-center justify-between rounded-lg border border-[#EEE5E9] bg-[#FCFAFB] px-3 py-2.5 text-left hover:border-[#F7BDD2] hover:bg-[#FFF5F8] cursor-pointer"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <NavIcon name={action.icon} className="h-4 w-4 text-[#8E2E52] shrink-0" />
                    <span className="block min-w-0">
                      <span className="block text-[13px] font-medium text-[#29232A] truncate">
                        {action.label}
                      </span>
                      <span className="block text-[11px] text-[#777078] truncate">
                        {action.scopeLabel}
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[#777078] shrink-0" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModalDialog>
  );
}
