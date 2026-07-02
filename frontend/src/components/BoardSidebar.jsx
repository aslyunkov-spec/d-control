import { useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Eye,
  Inbox,
  LogOut,
  Palette,
  Settings,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

// TODO: replace demo counts with backend unread/new counters.
const PRIMARY_ITEMS = [
  { id: "inbox", label: "\u0412\u0445\u043e\u0434\u044f\u0449\u0438\u0435", icon: Inbox, count: 7, active: true },
  { id: "today", label: "\u0421\u0435\u0433\u043e\u0434\u043d\u044f", icon: CalendarDays, count: 4 },
  { id: "overdue", label: "\u041f\u0440\u043e\u0441\u0440\u043e\u0447\u0435\u043d\u043d\u044b\u0435", icon: Clock3, count: 2 },
  { id: "pending-close", label: "\u041e\u0436\u0438\u0434\u0430\u044e\u0442 \u0437\u0430\u043a\u0440\u044b\u0442\u0438\u044f", icon: CheckCircle2, count: 3 },
  { id: "watching", label: "\u041d\u0430\u0431\u043b\u044e\u0434\u0430\u044e", icon: Eye, count: 5 },
];

const ADMIN_SECTION_LABEL = "\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435";

const ADMIN_ITEMS = [
  { id: "users", label: "\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0438", icon: Users },
  { id: "departments", label: "\u041e\u0442\u0434\u0435\u043b\u044b", icon: Building2 },
  { id: "permissions", label: "\u041f\u0440\u0430\u0432\u0430 \u0434\u043e\u0441\u0442\u0443\u043f\u0430", icon: ShieldCheck },
];

const FOOTER_ITEMS = [
  { id: "appearance", label: "\u0412\u043d\u0435\u0448\u043d\u0438\u0439 \u0432\u0438\u0434", icon: Palette },
  { id: "settings", label: "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f", icon: Settings },
];

function looksLikeMojibake(value = "") {
  return value.includes("\u0420\u0452") || value.includes("\u0420\u040f") || value.includes("\u0421\u201a");
}

function getDisplayUser(user) {
  const name = user?.name && !looksLikeMojibake(user.name) ? user.name : "\u0410\u043d\u0442\u043e\u043d";
  const role = user?.role && !looksLikeMojibake(user.role) ? user.role : "\u0414\u0438\u0440\u0435\u043a\u0442\u043e\u0440 \u0434\u0435\u043f\u0430\u0440\u0442\u0430\u043c\u0435\u043d\u0442\u0430";

  return { name, role };
}

function canSeeAdminItems(user) {
  const role = user?.role || "";
  // TODO: replace the local role check with backend effective permissions.
  return ["\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440", "\u0414\u0438\u0440\u0435\u043a\u0442\u043e\u0440"].includes(role) || looksLikeMojibake(role);
}

function SidebarItem({ item, onSelect, danger = false, nested = false }) {
  const Icon = item.icon;

  return (
    <button
      className={`board-sidebar__item${item.active ? " board-sidebar__item--active" : ""}${danger ? " board-sidebar__item--danger" : ""}${nested ? " board-sidebar__item--nested" : ""}`}
      type="button"
      onClick={onSelect}
    >
      <Icon aria-hidden="true" size={18} strokeWidth={2} />
      <span className="board-sidebar__item-label">{item.label}</span>
      {typeof item.count === "number" && <span className="board-sidebar__item-count">{item.count}</span>}
    </button>
  );
}

export function BoardSidebar({ isOpen, user, onClose, onOpenAppearance }) {
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsAdminOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  // TODO: close the Sidebar by Escape when Workspace keyboard handling is finalized.
  const displayUser = getDisplayUser(user);
  const showAdminItems = canSeeAdminItems(user);

  const handleSelect = (action) => {
    if (action === "appearance") {
      onOpenAppearance();
      return;
    }

    onClose();
  };

  const handleLayerMouseDown = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="board-sidebar-layer" role="presentation" onMouseDown={handleLayerMouseDown}>
      <aside className="board-sidebar" aria-label="\u041d\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044f Workspace">
        <header className="board-sidebar__profile">
          <button
            className="board-sidebar__avatar"
            type="button"
            aria-label="\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u043f\u0440\u043e\u0444\u0438\u043b\u044f"
            // TODO: open user settings when profile settings are connected.
            onClick={() => {}}
          >
            {displayUser.name.slice(0, 1).toUpperCase()}
          </button>
          <div className="board-sidebar__profile-text">
            <strong>{displayUser.name}</strong>
            <span>{displayUser.role}</span>
          </div>
          <button className="board-sidebar__close" type="button" onClick={onClose} aria-label="\u0417\u0430\u043a\u0440\u044b\u0442\u044c \u043c\u0435\u043d\u044e">
            <X aria-hidden="true" size={18} strokeWidth={2} />
          </button>
        </header>

        <div className="board-sidebar__content">
          <nav className="board-sidebar__nav" aria-label="\u041e\u0441\u043d\u043e\u0432\u043d\u0430\u044f \u043d\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044f">
            {PRIMARY_ITEMS.map((item) => (
              <SidebarItem key={item.id} item={item} onSelect={() => handleSelect(item.id)} />
            ))}
          </nav>

          <footer className="board-sidebar__footer">
            {showAdminItems && (
              <div className="board-sidebar__admin">
                <button
                  className="board-sidebar__item board-sidebar__admin-toggle"
                  type="button"
                  aria-expanded={isAdminOpen}
                  onClick={() => setIsAdminOpen((current) => !current)}
                >
                  <Settings2 aria-hidden="true" size={18} strokeWidth={2} />
                  <span className="board-sidebar__item-label">{ADMIN_SECTION_LABEL}</span>
                  {isAdminOpen ? <ChevronDown aria-hidden="true" size={16} /> : <ChevronRight aria-hidden="true" size={16} />}
                </button>
                {isAdminOpen && (
                  <div className="board-sidebar__admin-items">
                    {ADMIN_ITEMS.map((item) => (
                      <SidebarItem key={item.id} item={item} nested onSelect={() => handleSelect(item.id)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            <span className="board-sidebar__divider" aria-hidden="true" />
            {FOOTER_ITEMS.map((item) => (
              <SidebarItem key={item.id} item={item} onSelect={() => handleSelect(item.id)} />
            ))}
            <span className="board-sidebar__divider" aria-hidden="true" />
            <SidebarItem
              item={{ id: "logout", label: "\u0412\u044b\u0445\u043e\u0434", icon: LogOut }}
              danger
              onSelect={() => handleSelect("logout")}
            />
          </footer>
        </div>
      </aside>
    </div>
  );
}
