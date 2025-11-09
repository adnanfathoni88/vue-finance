/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom financial colors
        'primary': '#3B82F6',           // Blue for primary actions
        'primary-dark': '#2563EB',      // Darker blue for hover states
        'secondary': '#10B981',         // Green for positive actions (income)
        'secondary-dark': '#059669',    // Darker green for hover states
        'accent': '#F59E0B',           // Amber for warnings/important items
        'accent-dark': '#D97706',      // Darker amber for hover states
        'danger': '#EF4444',           // Red for negative actions (expenses)
        'danger-dark': '#DC2626',      // Darker red for hover states
        'success': '#10B981',          // Green for success states
        'warning': '#F59E0B',          // Amber for warning states
        'info': '#3B82F6',             // Blue for info states
        'background': '#F9FAFB',       // Light gray for backgrounds
        'surface': '#FFFFFF',          // White for card surfaces
        'text-primary': '#1F2937',     // Dark gray for primary text
        'text-secondary': '#6B7280',   // Medium gray for secondary text
        'border': '#E5E7EB',           // Light gray for borders
      }
    },
  },
  plugins: [],
}