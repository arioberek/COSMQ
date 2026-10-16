import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  type NativeSyntheticEvent,
  ScrollView,
  Text,
  TextInput,
  type TextInputSelectionChangeEventData,
  View,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { applySuggestion, getCurrentWord, getSuggestions } from "../../lib/sql/completion";
import { SQL_QUICK_ACTIONS, SQL_TEMPLATES } from "../../lib/sql/presets";
import { tokenizeSql } from "../../lib/sql/tokenizer";
import { AutocompletePopover } from "./autocomplete-popover";
import { Chip } from "./chip";

// Editor type per the design spec: JetBrains Mono 15/22. The highlight overlay
// and the transparent TextInput must share these metrics exactly.
const EDITOR_TEXT = { fontFamily: "JetBrainsMono", fontSize: 15, lineHeight: 22 } as const;
const EDITOR_PADDING = { paddingHorizontal: 14, paddingVertical: 12 } as const;
const EDITOR_MIN_HEIGHT = 140;
const EDITOR_MAX_HEIGHT = 360;

type SqlEditorProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  enableAutocomplete: boolean;
  showTemplates: boolean;
  showQuickActions: boolean;
};

function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={{ marginHorizontal: -16, flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {children}
    </ScrollView>
  );
}

/**
 * SQL text area with Xcode-colored syntax highlighting (a Text overlay under a
 * transparent TextInput), keyword autocomplete, and optional template and
 * quick-action chips.
 */
export const SqlEditor = memo(function SqlEditor({
  value,
  onChangeText,
  placeholder,
  enableAutocomplete,
  showTemplates,
  showQuickActions,
}: SqlEditorProps) {
  const theme = useTheme();
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const cursorRef = useRef(0);

  // Keyed by character offset, which identifies a token within one render.
  const tokens = useMemo(() => {
    let offset = 0;
    return tokenizeSql(value).map((token) => {
      const keyed = { ...token, offset };
      offset += token.value.length;
      return keyed;
    });
  }, [value]);
  const currentWord = useMemo(() => getCurrentWord(value, cursorPosition), [value, cursorPosition]);
  const suggestions = useMemo(
    () => (enableAutocomplete ? getSuggestions(value, cursorPosition, currentWord.word) : []),
    [value, cursorPosition, currentWord.word, enableAutocomplete],
  );

  const moveCursor = useCallback((position: number, focus: boolean) => {
    cursorRef.current = position;
    setCursorPosition(position);
    setTimeout(() => {
      if (focus) inputRef.current?.focus();
      inputRef.current?.setNativeProps({ selection: { start: position, end: position } });
    }, 0);
  }, []);

  const handleSelectionChange = useCallback(
    (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      const { start } = event.nativeEvent.selection;
      cursorRef.current = start;
      setCursorPosition(start);
      if (!enableAutocomplete) {
        setShowAutocomplete(false);
        return;
      }
      const word = getCurrentWord(value, start);
      setShowAutocomplete(getSuggestions(value, start, word.word).length > 0);
    },
    [value, enableAutocomplete],
  );

  const handleSuggestionPress = useCallback(
    (suggestion: string) => {
      const next = applySuggestion(value, currentWord, suggestion);
      onChangeText(next.text);
      setShowAutocomplete(false);
      moveCursor(next.cursor, false);
    },
    [value, currentWord, onChangeText, moveCursor],
  );

  const handleQuickAction = useCallback(
    (insertValue: string) => {
      const cursor = cursorRef.current;
      onChangeText(value.slice(0, cursor) + insertValue + value.slice(cursor));
      moveCursor(cursor + insertValue.length, true);
    },
    [value, onChangeText, moveCursor],
  );

  const handleTemplatePress = useCallback(
    (template: string) => {
      onChangeText(template);
      moveCursor(template.length, true);
    },
    [onChangeText, moveCursor],
  );

  const handleBlur = useCallback(() => {
    setTimeout(() => setShowAutocomplete(false), 150);
  }, []);

  return (
    <View style={{ gap: 10 }}>
      {showTemplates ? (
        <ChipRow>
          {SQL_TEMPLATES.map((t) => (
            <Chip key={t.label} label={t.label} onPress={() => handleTemplatePress(t.template)} />
          ))}
        </ChipRow>
      ) : null}

      <View style={{ position: "relative", zIndex: 10 }}>
        {showAutocomplete && suggestions.length > 0 ? (
          <AutocompletePopover
            suggestions={suggestions}
            prefix={currentWord.word}
            onSelect={handleSuggestionPress}
          />
        ) : null}

        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            borderCurve: "continuous",
            minHeight: EDITOR_MIN_HEIGHT,
            maxHeight: EDITOR_MAX_HEIGHT,
            overflow: "hidden",
          }}
        >
          <View
            pointerEvents="none"
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <Text style={[EDITOR_TEXT, EDITOR_PADDING]}>
              {tokens.map((token) => (
                <Text key={token.offset} style={{ color: theme.syntax[token.type] }}>
                  {token.value}
                </Text>
              ))}
            </Text>
          </View>
          <TextInput
            ref={inputRef}
            style={[
              EDITOR_TEXT,
              EDITOR_PADDING,
              {
                color: "transparent",
                backgroundColor: "transparent",
                // Web draws a focus ring around the textarea; the caret is enough.
                outlineWidth: 0,
                minHeight: EDITOR_MIN_HEIGHT,
                maxHeight: EDITOR_MAX_HEIGHT,
              },
            ]}
            value={value}
            onChangeText={onChangeText}
            onSelectionChange={handleSelectionChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.placeholder}
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            selectionColor={theme.colors.accent}
            accessibilityLabel="SQL editor"
          />
        </View>
      </View>

      {showQuickActions ? (
        <ChipRow>
          {SQL_QUICK_ACTIONS.map((action) => (
            <Chip
              key={action.label}
              label={action.label}
              mono
              onPress={() => handleQuickAction(action.value)}
            />
          ))}
        </ChipRow>
      ) : null}
    </View>
  );
});
