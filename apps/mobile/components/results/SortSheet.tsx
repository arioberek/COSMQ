import { memo, useEffect, useState } from "react";
import type { ColumnInfo } from "../../lib/types";
import { ModalSheet } from "../ui/Dialog";
import { ListRow, ListSection } from "../ui/List";
import { Segmented } from "./Segmented";

export type SortDir = "asc" | "desc" | null;

type SortSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnInfo[];
  sortColumn: string | null;
  sortDir: SortDir;
  onSelect: (column: string, dir: SortDir) => void;
  onClear: () => void;
};

const DIRECTIONS = ["Ascending", "Descending"];

export const SortSheet = memo(function SortSheet({
  open,
  onOpenChange,
  columns,
  sortColumn,
  sortDir,
  onSelect,
  onClear,
}: SortSheetProps) {
  // Direction chosen before a column is picked; mirrors the active sort.
  const [dir, setDir] = useState<"asc" | "desc">(sortDir ?? "asc");
  useEffect(() => {
    if (sortDir) setDir(sortDir);
  }, [sortDir]);

  const handleDirChange = (index: number) => {
    const next = index === 1 ? "desc" : "asc";
    setDir(next);
    if (sortColumn) onSelect(sortColumn, next);
  };

  return (
    <ModalSheet open={open} onOpenChange={onOpenChange} title="Sort By" snapPoints={[70]}>
      <Segmented
        values={DIRECTIONS}
        selectedIndex={dir === "desc" ? 1 : 0}
        onChange={handleDirChange}
        accessibilityLabel="Sort direction"
      />

      <ListSection title="Column">
        {columns.map((col, idx) => {
          const isSorted = sortColumn === col.name;
          return (
            <ListRow
              // biome-ignore lint/suspicious/noArrayIndexKey: unaliased joins can repeat column names
              key={`${col.name}-${idx}`}
              title={col.name}
              subtitle={col.type ? col.type.toLowerCase() : undefined}
              accessory={isSorted ? "check" : undefined}
              // Tapping the active column clears the sort, like the old ASC/DESC toggles.
              onPress={() => onSelect(col.name, isSorted ? null : dir)}
            />
          );
        })}
      </ListSection>

      {sortColumn ? (
        <ListSection>
          <ListRow title="Clear Sort" tint onPress={onClear} />
        </ListSection>
      ) : null}
    </ModalSheet>
  );
});
