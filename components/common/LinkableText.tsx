import React, { useCallback } from "react";
import { Linking, StyleProp, Text, TextStyle } from "react-native";

// Matches:
//   • https://... or http://...
//   • www. followed by a domain
//   • bare domains like sportyexpats.fr, example.com, sub.domain.co.uk
//     (must have a recognised TLD so random words with dots aren't caught)
const URL_REGEX =
  /(?:https?:\/\/(?:www\.)?|www\.)[\w\-][\w\-.]+(\.[\w]{2,})+(?:\/[^\s]*)?|[\w\-][\w\-.]+\.(?:com|fr|org|net|io|co|app|dev|me|info|biz|eu|uk|de|es|it|nl|be|ch|ca|au|nz|in|jp|br|mx|pt|pl|se|no|dk|fi|ru|za|sg|hk)(?:\/[^\s]*)?/gi;

function normaliseUrl(raw: string): string {
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

interface Props {
  text: string;
  /** Style for plain (non-link) text segments */
  textStyle?: StyleProp<TextStyle>;
  /** Style for link segments — defaults to green underline */
  linkStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

const LinkableText: React.FC<Props> = ({
  text,
  textStyle,
  linkStyle,
  numberOfLines,
}) => {
  const handlePress = useCallback((url: string) => {
    Linking.openURL(normaliseUrl(url)).catch(() => {});
  }, []);

  if (!text) return null;

  const parts: { text: string; isLink: boolean }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(URL_REGEX.source, "gi");

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), isLink: false });
    }
    parts.push({ text: match[0], isLink: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isLink: false });
  }

  // No URLs found — render plain text to avoid overhead
  if (parts.length === 1 && !parts[0].isLink) {
    return (
      <Text style={textStyle} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  return (
    <Text style={textStyle} numberOfLines={numberOfLines}>
      {parts.map((part, i) =>
        part.isLink ? (
          <Text
            key={i}
            style={[{ color: "#4ade80", textDecorationLine: "underline" }, linkStyle]}
            onPress={() => handlePress(part.text)}
            suppressHighlighting
          >
            {part.text}
          </Text>
        ) : (
          <Text key={i}>{part.text}</Text>
        )
      )}
    </Text>
  );
};

export default LinkableText;
