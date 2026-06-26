import { useEffect, useMemo, useState } from "react";

import { getUsers } from "../api/kanban";

function getDisplayName(user) {
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  return fullName || user.email || user.username || "User";
}

function getInitials(user) {
  const names = [user.first_name, user.last_name].filter(Boolean);
  if (names.length) {
    return names.map((name) => name.slice(0, 1)).join("").toUpperCase();
  }

  return String(user.username || user.email || "?").slice(0, 2).toUpperCase();
}

function getUserTitle(user) {
  return [getDisplayName(user), user.email, user.role].filter(Boolean).join("\n");
}

export function UserPicker({
  value = [],
  onChange,
  placeholder = "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f",
  disabled = false,
  readOnly = false,
  searchOnly = false,
  autoFocus = false,
  onClose,
  onSelection,
}) {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const isInteractive = !disabled && !readOnly;

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        const data = await getUsers();
        if (isMounted) {
          setUsers(data);
        }
      } catch {
        if (isMounted) {
          setError("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0435\u0439.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedIds = useMemo(() => new Set(value.map((user) => String(user.id))), [value]);
  const matchingUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");
    return users.filter((user) => {
      if (selectedIds.has(String(user.id))) {
        return false;
      }

      const searchableText = [getDisplayName(user), user.email, user.username]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ru-RU");
      return !normalizedQuery || searchableText.includes(normalizedQuery);
    });
  }, [query, selectedIds, users]);

  function addUser(user) {
    if (!isInteractive) {
      return;
    }

    onChange?.([...value, user]);
    setQuery("");
    onSelection?.(user);
    if (!onSelection) {
      setIsOpen(true);
    }
  }

  function removeUser(userId) {
    if (!isInteractive) {
      return;
    }

    onChange?.(value.filter((user) => String(user.id) !== String(userId)));
  }

  return (
    <div className={`user-picker ${disabled ? "user-picker--disabled" : ""} ${readOnly ? "user-picker--readonly" : ""}`}>
      <div className="user-picker__control">
        {!searchOnly && (
          <div className="user-picker__selected-users">
          {value.map((user) => (
            <span className="user-picker__avatar" key={user.id} title={getUserTitle(user)}>
              {getInitials(user)}
              {isInteractive && (
                <button
                  type="button"
                  aria-label={"\u0423\u0431\u0440\u0430\u0442\u044c " + getDisplayName(user)}
                  onClick={() => removeUser(user.id)}
                >
                  \u00d7
                </button>
              )}
            </span>
          ))}
          </div>
        )}
        {!readOnly && (
          <input
            autoFocus={autoFocus}
            type="search"
            value={query}
            disabled={disabled}
            placeholder={isLoading ? "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430..." : placeholder}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onBlur={() => window.setTimeout(() => {
              setIsOpen(false);
              onClose?.();
            }, 120)}
          />
        )}
      </div>

      {isInteractive && isOpen && (
        <div className="user-picker__menu" role="listbox">
          {matchingUsers.map((user) => (
            <button key={user.id} type="button" role="option" onMouseDown={(event) => event.preventDefault()} onClick={() => addUser(user)}>
              <span className="user-picker__option-avatar">{getInitials(user)}</span>
              <span className="user-picker__option-text">
                <strong>{getDisplayName(user)}</strong>
                <small>{user.email || user.role || user.department || user.username}</small>
              </span>
            </button>
          ))}
          {!isLoading && !matchingUsers.length && (
            <span className="user-picker__empty">{"\u041d\u0435\u0442 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0435\u0439"}</span>
          )}
        </div>
      )}
      {error && <p className="user-picker__error">{error}</p>}
    </div>
  );
}
