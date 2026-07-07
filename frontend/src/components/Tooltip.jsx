export function Tooltip({ as: Component = "span", label, className = "", children, ...props }) {
  const tooltipClassName = ["ui-tooltip", className].filter(Boolean).join(" ");

  return (
    <Component className={tooltipClassName} data-tooltip={label} {...props}>
      {children}
    </Component>
  );
}
