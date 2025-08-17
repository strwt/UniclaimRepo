import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";

interface NavLinkItemProps {
  icon: ReactNode;
  label: string;
  to: string;
  isOpen: boolean;
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  hoverContainerBgClass?: string;
  tooltipIconClassName?: string;
  tooltipTextClassName?: string;
}

export default function NavText({
  icon,
  label,
  to,
  isOpen,
  onClick,
  className = "",
  iconClassName = "",
  textClassName = "",
  hoverContainerBgClass = "",
  tooltipIconClassName = "",
  tooltipTextClassName = "",
}: NavLinkItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={clsx(
        "group relative flex items-center py-3 px-4 transition-all duration-300 rounded-md",
        isOpen ? "justify-start gap-5" : "justify-center",
        className // This still controls container styles like hover background
      )}
    >
      {/* 👇 Icon color changes when active */}
      <span className={clsx(iconClassName, isActive && "text-brand")}>
        {icon}
      </span>

      {/* 👇 Text color changes when active */}
      <span
        className={clsx(
          "overflow-hidden whitespace-nowrap transition-all duration-300",
          isOpen ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0",
          textClassName,
          isActive && "text-brand"
        )}
      >
        {label}
      </span>

      {/* Tooltip (optional) */}
      {!isOpen && (
        <div className="absolute top-1/2 -left-5 -translate-y-1/2 whitespace-nowrap z-10 pointer-events-none w-65 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
          <div
            className={clsx(
              "flex items-center gap-3 py-2 pl-8 h-13 text-sm",
              hoverContainerBgClass || "bg-brand"
            )}
          >
            <span className={clsx(tooltipIconClassName)}>{icon}</span>
            <span className={clsx("ml-7", tooltipTextClassName)}>{label}</span>
          </div>
        </div>
      )}
    </Link>
  );
}
