"use client";

import React from "react";
import styles from "./DataTable.module.css";
import { EditIcon, TrashIcon } from "./icons";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/**
 * columns:
 *  - key: string
 *  - header: ReactNode
 *  - render?: (row) => ReactNode
 *  - className?: string
 */
export function DataTable({
  columns,
  data,
  rowKey = "id",
  onEdit,
  onDelete,
  actionsHeader = "Actions",
  emptyText = "No records found.",
  className,
  getRowId,
  onRowClick,
}) {
  const rows = Array.isArray(data) ? data : [];
  const hasActions = Boolean(onEdit || onDelete);

  const resolveRowId = (row, idx) => {
    if (typeof getRowId === "function") return getRowId(row, idx);
    if (row && typeof row === "object" && rowKey in row) return row[rowKey];
    return idx;
  };

  return (
    <div className={cx(styles.wrap, className)}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cx(styles.th, c.className)}>
                {c.header}
              </th>
            ))}
            {hasActions && <th className={styles.th}>{actionsHeader}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                className={styles.empty}
                colSpan={columns.length + (hasActions ? 1 : 0)}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => {
              const id = resolveRowId(row, idx);
              return (
                <tr
                  key={id}
                  className={styles.tr}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  role={onRowClick ? "button" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cx(styles.td, c.className)}>
                      {typeof c.render === "function"
                        ? c.render(row, idx)
                        : String(row?.[c.key] ?? "")}
                    </td>
                  ))}
                  {hasActions && (
                    <td className={styles.td}>
                      <div className={styles.actions}>
                        {onEdit && (
                          <button
                            className={cx(styles.iconButton, styles.iconEdit)}
                            aria-label="Edit"
                            title="Edit"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(row);
                            }}
                          >
                            <EditIcon size={14} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            className={cx(styles.iconButton, styles.iconDelete)}
                            aria-label="Delete"
                            title="Delete"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(row);
                            }}
                          >
                            <TrashIcon size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

