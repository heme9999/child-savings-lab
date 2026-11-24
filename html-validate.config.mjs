import { defineFlatConfig, esmResolver, FlatCompat } from 'html-validate';
import html5 from 'html-validate/elements/html5';

const compat = new FlatCompat([esmResolver()]);
export default defineFlatConfig([
  { files: ['**/*.html'], ...await compat.config({ extends: ['./.htmlvalidate.json'] }), elements: [html5] },
  // Keep the user's exact 74-character title; other pages retain the 70-character check.
  { files: ['dist/trump-accounts/index.html'], rules: { 'long-title': ['error', { maxlength: 74 }] } }
]);
