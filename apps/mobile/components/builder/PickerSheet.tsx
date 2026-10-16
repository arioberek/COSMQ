import { memo, useEffect, useMemo, useState } from "react";
import { useHaptic } from "../../lib/haptics";
import { SearchField } from "../results/SearchField";
import { ModalSheet } from "../ui/Dialog";
import { ListRow, ListSection } from "../ui/List";
import { AppText } from "../ui/Text";

export interface PickerOption {
  id: string;
  label: string;
  sublabel?: string;
}

type PickerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: PickerOption[];
  selected: string[];
  multi?: boolean;
  searchable?: boolean;
  emptyText?: string;
  onSelect: (ids: string[]) => void;
};

export const PickerSheet = memo(function PickerSheet({
  open,
  onOpenChange,
  title,
  options,
  selected,
  multi = false,
  searchable = true,
  emptyText = "Nothing to pick.",
  onSelect,
}: PickerSheetProps) {
  const haptic = useHaptic();
  const [search, setSearch] = useState("");

  // Reset the search needle whenever the sheet is dismissed so the next time
  // it opens (potentially for a different field) the user sees the full list,
  // not the previously typed filter still applied.
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const needle = search.trim().toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(needle) || (o.sublabel ?? "").toLowerCase().includes(needle),
    );
  }, [options, search]);

  const toggle = (id: string) => {
    haptic.light();
    if (multi) {
      if (selected.includes(id)) {
        onSelect(selected.filter((s) => s !== id));
      } else {
        onSelect([...selected, id]);
      }
      return;
    }
    onSelect([id]);
    onOpenChange(false);
  };

  const showSearch = searchable && options.length > 6;

  return (
    <ModalSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      subtitle={multi && selected.length > 0 ? `${selected.length} selected` : undefined}
      snapPoints={[80]}
      toolbar={
        showSearch ? (
          <SearchField value={search} onChangeText={setSearch} placeholder="Search" />
        ) : undefined
      }
    >
      {filtered.length === 0 ? (
        <AppText
          variant="footnote"
          tone="secondary"
          paddingVertical="$lg"
          style={{ textAlign: "center" }}
        >
          {search.trim() ? "No matches." : emptyText}
        </AppText>
      ) : (
        <ListSection>
          {filtered.map((opt) => (
            <ListRow
              key={opt.id}
              title={opt.label}
              subtitle={opt.sublabel}
              accessory={selected.includes(opt.id) ? "check" : undefined}
              onPress={() => toggle(opt.id)}
            />
          ))}
        </ListSection>
      )}
    </ModalSheet>
  );
});
