const COMMON_ITEMS = [
  "Входящие",
  "Просроченные",
  "Наблюдаю",
  "Сегодня",
];

const ADMIN_ITEMS = ["Пользователи", "Отделы", "Права доступа"];

export function BoardSidebar({ isOpen, user, onClose, onOpenAppearance }) {
  if (!isOpen) {
    return null;
  }

  const canManage = ["Администратор", "Директор"].includes(user.role);

  return (
    <div className="board-sidebar-layer" role="presentation" onMouseDown={onClose}>
      <aside
        className="board-sidebar"
        aria-label="Навигация"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="board-sidebar__profile">
          <div>
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть меню">×</button>
        </header>

        <nav className="board-sidebar__nav" aria-label="Разделы">
          {COMMON_ITEMS.map((item) => (
            <button key={item} type="button">{item}</button>
          ))}
          <button type="button" onClick={onOpenAppearance}>Внешний вид</button>
          <button type="button">Настройки</button>

          {canManage && (
            <>
              <span className="board-sidebar__divider" aria-hidden="true" />
              {ADMIN_ITEMS.map((item) => (
                <button key={item} type="button">{item}</button>
              ))}
            </>
          )}
        </nav>

        <footer className="board-sidebar__footer">
          <button type="button">Выход</button>
        </footer>
      </aside>
    </div>
  );
}