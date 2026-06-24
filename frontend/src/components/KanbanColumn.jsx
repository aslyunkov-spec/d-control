import { KanbanColumnSection } from "./KanbanColumnSection";

const SECTION_CONFIG = [
  { key: "active", title: "Активные" },
  { key: "deferred", title: "Отложенные" },
  { key: "completed", title: "Выполненные" },
  { key: "archived", title: "Архив", collapsedByDefault: true },
];

function getTaskSection(task) {
  return task.status_system_type || "active";
}

export function KanbanColumn({ title, tasks, onOpenTask }) {
  const tasksBySection = SECTION_CONFIG.reduce((sections, section) => {
    sections[section.key] = [];
    return sections;
  }, {});

  tasks.forEach((task) => {
    const sectionKey = getTaskSection(task);
    const targetSection = tasksBySection[sectionKey] ? sectionKey : "active";
    tasksBySection[targetSection].push(task);
  });

  return (
    <section className="kanban-column" aria-label={title}>
      <header className="kanban-column__header">
        <h2>{title}</h2>
        <span>{tasks.length}</span>
      </header>

      <div className="kanban-column__tasks">
        {SECTION_CONFIG.map((section) => (
          <KanbanColumnSection
            key={section.key}
            title={section.title}
            tasks={tasksBySection[section.key]}
            collapsedByDefault={section.collapsedByDefault}
            onOpenTask={onOpenTask}
          />
        ))}
      </div>
    </section>
  );
}