import { studioTheme } from 'ag-studio'
import type { AgStudioTheme, AgStudioThemeParams } from 'ag-studio'

const FONT = "Lexend, Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"

/** Build a 1px solid border in the palette used across the app. */
const line = (color: string) => ({ style: 'solid' as const, width: 1, color })

/**
 * AG Studio theme matching TrustBroker's dark navy palette
 * (surface #0B1326, card #131B2E, border #1E293B, accent #3B82F6).
 */
export const trustBrokerStudioTheme: AgStudioTheme<AgStudioThemeParams> = studioTheme.withParams({
  // ---- shared tokens ----
  backgroundColor: '#0B1326',
  foregroundColor: '#F8FAFC',
  textColor: '#F8FAFC',
  subtleTextColor: '#94A3B8',
  accentColor: '#3B82F6',
  borderColor: '#1E293B',
  browserColorScheme: 'dark',
  fontFamily: FONT,
  fontSize: 13,
  iconColor: '#94A3B8',
  rowHoverColor: '#16213A',
  menuBackgroundColor: '#131B2E',
  menuTextColor: '#F8FAFC',
  menuBorder: line('#222A3D'),
  tooltipBackgroundColor: '#131B2E',
  tooltipTextColor: '#F8FAFC',
  tooltipBorder: line('#222A3D'),

  // ---- studio chrome ----
  studioWrapperBackgroundColor: '#0B1326',
  studioPanelContainerBackgroundColor: '#0E172E',
  studioPanelContainerBorder: line('#1E293B'),
  studioPanelSectionBorderColor: '#1E293B',
  studioPanelDividerColor: '#1E293B',
  studioPanelDividerActiveColor: '#3B82F6',
  studioPanelGroupBackgroundColor: '#131B2E',
  studioPanelGroupTitleBarTextColor: '#94A3B8',
  studioPanelHeaderFontFamily: FONT,
  studioFormLabelColor: '#94A3B8',
  studioToggleButtonActiveBackgroundColor: '#3B82F6',
  studioToggleButtonActiveBorderColor: '#3B82F6',
  studioToggleButtonActiveColor: '#FFFFFF',

  // ---- canvas ----
  studioCanvasBackgroundColor: '#0B1326',
  studioCanvasGridLineColor: '#16213A',
  studioCanvasBorder: line('#1E293B'),
  studioCanvasBorderRadius: 12,
  studioCanvasFontFamily: FONT,

  // ---- widget cards ----
  studioWidgetBackgroundColor: '#131B2E',
  studioWidgetBorder: line('#222A3D'),
  studioWidgetBorderRadius: 12,
  studioWidgetPadding: 8,
  studioWidgetTitleFontFamily: FONT,
  studioWidgetTitleFontSize: 14,
  studioWidgetTitleFontWeight: '600',
  studioWidgetTitleTextColor: '#F8FAFC',
  studioWidgetSubtitleFontFamily: FONT,
  studioWidgetSubtitleTextColor: '#94A3B8',
  studioWidgetCaptionFontFamily: FONT,
  studioWidgetCaptionTextColor: '#94A3B8',
  studioWidgetToolbarBackgroundColor: '#131B2E',
  studioWidgetToolbarBorder: line('#222A3D'),
  studioWidgetToolbarButtonColor: '#94A3B8',
  studioWidgetToolbarButtonHoverBackgroundColor: '#1E293B',
  studioValueWidgetFontSize: 26,
  studioTextWidgetFontSize: 20,
  studioLinearGaugeLabelColor: '#F8FAFC',

  // ---- grid widgets ----
  gridBrowserColorScheme: 'dark',
  gridFontFamily: FONT,
  gridHeaderFontFamily: FONT,
  gridHeaderBackgroundColor: '#131B2E',
  gridHeaderTextColor: '#94A3B8',
  gridDataBackgroundColor: '#0E172E',
  gridOddRowBackgroundColor: '#0E172E',
  gridCellTextColor: '#E2E8F0',
  gridAccentColor: '#3B82F6',
  gridIconColor: '#94A3B8',
  gridRowHoverColor: '#16213A',
  gridRowBorder: line('#1E293B'),
  gridHeaderRowBorder: line('#1E293B'),
  gridWrapperBorder: line('#1E293B'),
  gridWrapperBorderRadius: 10,

  // ---- charts ----
  chartFontFamily: FONT,
  chartTextColor: '#F8FAFC',
  chartSubtleTextColor: '#94A3B8',
  chartAxisLineColor: '#334155',
  chartGridLineColor: '#1E293B',
  chartAccentColor: '#3B82F6',
  chartBorderColor: '#1E293B',
  chartTooltipBackgroundColor: '#131B2E',
  chartTooltipTextColor: '#F8FAFC',
  chartTooltipBorder: line('#222A3D'),
  chartPaletteFills1Color: '#3B82F6',
  chartPaletteFills2Color: '#10B981',
  chartPaletteFills3Color: '#8B5CF6',
  chartPaletteFills4Color: '#F59E0B',
  chartPaletteFills5Color: '#06B6D4',
  chartPaletteFills6Color: '#EC4899',
  chartPaletteFills7Color: '#64748B',
  chartPaletteStrokes1Color: '#2563EB',
  chartPaletteStrokes2Color: '#059669',
  chartPaletteStrokes3Color: '#7C3AED',
  chartPaletteStrokes4Color: '#D97706',
  chartPaletteStrokes5Color: '#0891B2',
  chartPaletteStrokes6Color: '#DB2777',
  chartPaletteStrokes7Color: '#475569',
})
