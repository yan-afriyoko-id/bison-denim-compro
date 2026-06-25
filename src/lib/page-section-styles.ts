import type { CSSProperties } from 'react';
import type { PageSection } from '@/types';

function getSectionSettings(section: PageSection) {
  return (section.settings ?? {}) as Record<string, unknown>;
}

function getOptionalColor(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const color = value.trim();
  return color ? color : undefined;
}

export function getSectionColorStyles(
  section: PageSection,
  fallback: {
    titleColor?: string;
    bodyColor?: string;
    linkColor?: string;
    buttonTextColor?: string;
    buttonBackgroundColor?: string;
  } = {}
) {
  const settings = getSectionSettings(section);
  const titleColor = getOptionalColor(settings.title_color) ?? fallback.titleColor;
  const bodyColor = getOptionalColor(settings.body_color) ?? fallback.bodyColor;
  const linkColor = getOptionalColor(settings.link_color) ?? fallback.linkColor ?? bodyColor;
  const buttonTextColor = getOptionalColor(settings.button_text_color) ?? fallback.buttonTextColor;
  const buttonBackgroundColor = getOptionalColor(settings.button_background_color) ?? fallback.buttonBackgroundColor;

  return {
    titleStyle: titleColor ? ({ color: titleColor } satisfies CSSProperties) : undefined,
    bodyStyle: bodyColor ? ({ color: bodyColor } satisfies CSSProperties) : undefined,
    linkColor,
    buttonStyle:
      buttonTextColor || buttonBackgroundColor
        ? ({
            ...(buttonTextColor ? { color: buttonTextColor } : {}),
            ...(buttonBackgroundColor ? { backgroundColor: buttonBackgroundColor } : {}),
          } satisfies CSSProperties)
        : undefined,
  };
}
