"use client";

import { type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

interface TableProps {
  children: ReactNode;
  className?: string;
  sticky?: boolean;
}

export function Table({ children, className, sticky = true }: TableProps) {
  return (
    <div className={cn("w-full overflow-auto rounded-xl border border-border bg-white", className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function TableHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <thead className={cn("bg-surface-light/5 border-b border-border", className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: { children: ReactNode; className?: string }) {
  return <tbody className={cn(className)}>{children}</tbody>;
}

export function TableRow({
  children,
  className,
  hover = true,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-b border-border last:border-b-0",
        hover && "hover:bg-primary-50/50 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className,
  sort,
  onSort,
}: {
  children: ReactNode;
  className?: string;
  sort?: "asc" | "desc" | null;
  onSort?: () => void;
}) {
  return (
    <th
      className={cn(
        "text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider",
        onSort && "cursor-pointer hover:text-fg select-none transition-colors",
        className
      )}
      onClick={onSort}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {onSort && (
          <span className="text-muted/50">
            {sort === "asc" ? (
              <ChevronUp className="w-3 h-3" />
            ) : sort === "desc" ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronsUpDown className="w-3 h-3" />
            )}
          </span>
        )}
      </span>
    </th>
  );
}

export function TableCell({
  children,
  className,
  mono,
}: {
  children: ReactNode;
  className?: string;
  mono?: boolean;
}) {
  return (
    <td className={cn("px-4 py-3", mono && "font-mono text-xs", className)}>
      {children}
    </td>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow hover={false}>
          {Array.from({ length: cols }).map((_, i) => (
            <TableHead key={i}>
              <div className="h-3 w-16 rounded shimmer-bg animate-shimmer" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i} hover={false}>
            {Array.from({ length: cols }).map((_, j) => (
              <td key={j} className="px-4 py-3">
                <div className="h-3 w-24 rounded shimmer-bg animate-shimmer" />
              </td>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
