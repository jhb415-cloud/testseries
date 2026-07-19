/* 페이지속도 개선 (v1.2.4): Tailwind CDN(런타임 124KB JS + 기기에서 CSS 생성)을 걷어내고
   이 설정으로 정적 tailwind.css를 미리 생성해 커밋하는 방식으로 전환.
   theme.extend 내용은 기존 index.html 인라인 tailwind.config와 동일해야 함(옮겨온 것).

   ⚠️ index.html/app.js/data.js 등에서 "새로운" Tailwind 클래스를 쓰기 시작했다면 반드시 재생성:
     npx tailwindcss@3.4.17 -c tailwind.config.js -i tailwind.source.css -o tailwind.css --minify
   (이미 어딘가에서 쓰던 클래스는 이미 포함돼 있으므로 재생성 불필요) */
module.exports = {
  content: ['./index.html', './app.js', './data.js', './supabase-client.js', './kakao-share.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans KR"', '"Noto Sans KR Fallback"', '-apple-system', 'BlinkMacSystemFont', '"Malgun Gothic"', '"Apple SD Gothic Neo"', 'sans-serif'],
        display: ['"Noto Sans KR"', '"Noto Sans KR Fallback"', '-apple-system', '"Malgun Gothic"', 'sans-serif'],
        label: ['"Noto Sans KR"', '"Noto Sans KR Fallback"', '-apple-system', '"Malgun Gothic"', 'sans-serif'],
      },
      colors: {
        slate: {
          50:  'rgb(var(--slate-50) / <alpha-value>)',
          100: 'rgb(var(--slate-100) / <alpha-value>)',
          200: 'rgb(var(--slate-200) / <alpha-value>)',
          300: 'rgb(var(--slate-300) / <alpha-value>)',
          400: 'rgb(var(--slate-400) / <alpha-value>)',
          500: 'rgb(var(--slate-500) / <alpha-value>)',
          600: 'rgb(var(--slate-600) / <alpha-value>)',
          700: 'rgb(var(--slate-700) / <alpha-value>)',
          800: 'rgb(var(--slate-800) / <alpha-value>)',
          900: 'rgb(var(--slate-900) / <alpha-value>)',
          950: 'rgb(var(--slate-950) / <alpha-value>)',
        },
        blue:    { 700: 'rgb(var(--blue-700) / <alpha-value>)',    900: 'rgb(var(--blue-900) / <alpha-value>)',    300: 'rgb(var(--blue-300) / <alpha-value>)',    400: 'rgb(var(--blue-400) / <alpha-value>)' },
        indigo:  { 900: 'rgb(var(--indigo-900) / <alpha-value>)',  700: 'rgb(var(--indigo-700) / <alpha-value>)',  200: 'rgb(var(--indigo-200) / <alpha-value>)',  300: 'rgb(var(--indigo-300) / <alpha-value>)' },
        violet:  { 900: 'rgb(var(--violet-900) / <alpha-value>)',  800: 'rgb(var(--violet-800) / <alpha-value>)',  700: 'rgb(var(--violet-700) / <alpha-value>)',  200: 'rgb(var(--violet-200) / <alpha-value>)',  300: 'rgb(var(--violet-300) / <alpha-value>)',  400: 'rgb(var(--violet-400) / <alpha-value>)' },
        purple:  { 800: 'rgb(var(--purple-800) / <alpha-value>)',  700: 'rgb(var(--purple-700) / <alpha-value>)',  300: 'rgb(var(--purple-300) / <alpha-value>)' },
        emerald: { 700: 'rgb(var(--emerald-700) / <alpha-value>)', 800: 'rgb(var(--emerald-800) / <alpha-value>)', 900: 'rgb(var(--emerald-900) / <alpha-value>)', 200: 'rgb(var(--emerald-200) / <alpha-value>)', 300: 'rgb(var(--emerald-300) / <alpha-value>)', 400: 'rgb(var(--emerald-400) / <alpha-value>)' },
        rose:    { 700: 'rgb(var(--rose-700) / <alpha-value>)',    800: 'rgb(var(--rose-800) / <alpha-value>)',    900: 'rgb(var(--rose-900) / <alpha-value>)',    200: 'rgb(var(--rose-200) / <alpha-value>)',    300: 'rgb(var(--rose-300) / <alpha-value>)',    400: 'rgb(var(--rose-400) / <alpha-value>)' },
        amber:   { 900: 'rgb(var(--amber-900) / <alpha-value>)',   800: 'rgb(var(--amber-800) / <alpha-value>)',   700: 'rgb(var(--amber-700) / <alpha-value>)',   300: 'rgb(var(--amber-300) / <alpha-value>)',   400: 'rgb(var(--amber-400) / <alpha-value>)' },
        yellow:  { 900: 'rgb(var(--yellow-900) / <alpha-value>)',  700: 'rgb(var(--yellow-700) / <alpha-value>)',  200: 'rgb(var(--yellow-200) / <alpha-value>)',  300: 'rgb(var(--yellow-300) / <alpha-value>)',  400: 'rgb(var(--yellow-400) / <alpha-value>)' },
        pink:    { 900: 'rgb(var(--pink-900) / <alpha-value>)',    800: 'rgb(var(--pink-800) / <alpha-value>)',    700: 'rgb(var(--pink-700) / <alpha-value>)',    200: 'rgb(var(--pink-200) / <alpha-value>)',    300: 'rgb(var(--pink-300) / <alpha-value>)',    400: 'rgb(var(--pink-400) / <alpha-value>)' },
        fuchsia: { 900: 'rgb(var(--fuchsia-900) / <alpha-value>)', 700: 'rgb(var(--fuchsia-700) / <alpha-value>)', 200: 'rgb(var(--fuchsia-200) / <alpha-value>)' },
        orange:  { 900: 'rgb(var(--orange-900) / <alpha-value>)', 700: 'rgb(var(--orange-700) / <alpha-value>)',  300: 'rgb(var(--orange-300) / <alpha-value>)',  400: 'rgb(var(--orange-400) / <alpha-value>)' },
        cyan:    { 700: 'rgb(var(--cyan-700) / <alpha-value>)',    300: 'rgb(var(--cyan-300) / <alpha-value>)',    400: 'rgb(var(--cyan-400) / <alpha-value>)' },
      }
    }
  }
};
