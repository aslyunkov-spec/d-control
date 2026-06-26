const BACKGROUND_OPTIONS = [
  { value: "default", label: "По умолчанию" },
  { value: "color", label: "Однотонный цвет" },
  { value: "gradient", label: "Градиент" },
  { value: "image", label: "Собственное изображение" },
];

const FONT_SIZE_OPTIONS = [
  { value: "compact", label: "Компактный" },
  { value: "default", label: "По умолчанию" },
  { value: "comfortable", label: "Крупнее" },
];

const DENSITY_OPTIONS = [
  { value: "compact", label: "Плотно" },
  { value: "default", label: "По умолчанию" },
  { value: "comfortable", label: "Свободно" },
];
const COLUMN_OPACITY_OPTIONS = [
  { value: "default", label: "По умолчанию" },
  { value: "low", label: "Низкая прозрачность" },
  { value: "medium", label: "Средняя прозрачность" },
  { value: "high", label: "Повышенная прозрачность" },
];

const CARD_RADIUS_OPTIONS = [
  { value: "strong", label: "Сильно" },
  { value: "medium", label: "Средне" },
  { value: "none", label: "Нет" },
];

function PreferenceSelect({ label, value, options, onChange }) {
  return (
    <label className="appearance-settings__field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="appearance-settings__field appearance-settings__color-field">
      <span>{label}</span>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function AppearanceSettings({ settings, onChange, onClose }) {
  return (
    <div className="appearance-modal" role="presentation" onMouseDown={onClose}>
      <section
        className="appearance-settings"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appearance-settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="appearance-settings__header">
          <div>
            <h2 id="appearance-settings-title">Внешний вид</h2>
            <p>Настройки сохраняются только в этом браузере.</p>
          </div>
          <button type="button" className="appearance-settings__close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        <div className="appearance-settings__content">
          <PreferenceSelect
            label="Фон доски"
            value={settings.background}
            options={BACKGROUND_OPTIONS}
            onChange={(background) => onChange({ background })}
          />
          {settings.background === "color" && (
            <ColorField
              label="Цвет фона"
              value={settings.backgroundColor}
              onChange={(backgroundColor) => onChange({ backgroundColor })}
            />
          )}
          {settings.background === "gradient" && (
            <div className="appearance-settings__color-row">
              <ColorField
                label="Первый цвет"
                value={settings.gradientStart}
                onChange={(gradientStart) => onChange({ gradientStart })}
              />
              <ColorField
                label="Второй цвет"
                value={settings.gradientEnd}
                onChange={(gradientEnd) => onChange({ gradientEnd })}
              />
            </div>
          )}
          {settings.background === "image" && (
            <label className="appearance-settings__field">
              <span>URL изображения</span>
              <input
                type="url"
                value={settings.backgroundImageUrl}
                placeholder="https://example.com/background.jpg"
                onChange={(event) => onChange({ backgroundImageUrl: event.target.value })}
              />
            </label>
          )}
          <PreferenceSelect
            label="Размер шрифта"
            value={settings.fontSize}
            options={FONT_SIZE_OPTIONS}
            onChange={(fontSize) => onChange({ fontSize })}
          />
          <PreferenceSelect
            label="Плотность карточек"
            value={settings.density}
            options={DENSITY_OPTIONS}
            onChange={(density) => onChange({ density })}
          />
          <PreferenceSelect
            label="Прозрачность колонок"
            value={settings.columnOpacity}
            options={COLUMN_OPACITY_OPTIONS}
            onChange={(columnOpacity) => onChange({ columnOpacity })}
          />          <PreferenceSelect
            label="Скругление элементов доски"
            value={settings.cardRadius}
            options={CARD_RADIUS_OPTIONS}
            onChange={(cardRadius) => onChange({ cardRadius })}
          />
        </div>
      </section>
    </div>
  );
}