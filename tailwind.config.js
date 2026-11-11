/**
 * Design tokens, following DESIGN.md: white surfaces on a faint cool-grey canvas,
 * black type with tight negative tracking, pill controls, 28px cards with soft
 * dual-layer shadows, and a single violet accent (search submit + wordmark dot).
 */
module.exports = {
  content: ['./public/*.html', './public/assets/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#000000', 2: '#2A2A2A' },
        muted: '#6F6C6B',                       // Muted Gray, a touch darker for AA contrast on the canvas
        canvas: '#F2F4F5',                      // Canvas Mist: page washes and image wells
        stage: '#F2F4F5',
        mist: '#F2F4F5',
        line: { DEFAULT: '#EBEBEB', strong: '#CCCCCC' },
        violet: { DEFAULT: '#5433EB', 2: '#4526D6', wash: '#C0B5F3' },
        kraft: '#B07A4B',
        ok: { DEFAULT: '#1D6F47', soft: '#E5F2EB' },
        bad: { DEFAULT: '#B42318', soft: '#FDECEA' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      letterSpacing: {
        body: '-0.031em',
        head: '-0.05em',
        snug: '-0.02em',
      },
      borderRadius: { ctl: '9999px', tile: '20px', panel: '28px' },
      boxShadow: {
        card: 'rgba(0,0,0,0.1) 0px 4px 6px -1px, rgba(0,0,0,0.1) 0px 2px 4px -2px',
        pill: 'rgba(0,0,0,0.06) 0px 2px 8px 0px',
        float: 'rgba(0,0,0,0.12) 0px 4px 24px 0px',
        violet: 'rgba(69,36,219,0.34) 0px 4px 24px 0px',
      },
      maxWidth: { page: '1200px', prose: '68ch' },
    },
  },
  plugins: [],
};
