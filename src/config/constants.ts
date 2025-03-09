// Canvas settings
export const DEFAULT_CANVAS_WIDTH = 100;
export const DEFAULT_CANVAS_HEIGHT = 100;
export const DEFAULT_CHUNK_SIZE = 20;
export const DEFAULT_COLOR = '#EFEFEF'; // Very light gray to distinguish from white or black
export const MAX_VIEWPORT_SCALE = 40;
export const MIN_VIEWPORT_SCALE = 1;

// UI settings
export const DEFAULT_COLOR_PALETTE = [
  '#000000', // Black
  '#FFFFFF', // White
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FF8000', // Orange
  '#8000FF', // Purple
  '#0080FF', // Light Blue
  '#FF0080', // Pink
  '#80FF00', // Lime
  '#808080', // Gray
  '#800000', // Dark Red
  '#008000', // Dark Green
];

export const MAX_ACTIVITY_FEED_ITEMS = 50;
export const TRANSACTION_TIMEOUT_SECONDS = 60;

// Feature flags
export const FEATURES = {
  enableHistoricalView: false,
  enableExport: true,
  enableSocialFeatures: true,
  enableHeatmap: false,
}; 