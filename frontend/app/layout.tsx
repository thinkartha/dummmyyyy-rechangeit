import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'LoveHeartBeat',
  description:
    'Observability platform for APIs, AI, ETL, alerts, and multi-cloud cost monitoring',
  icons: {
    icon: [
      { url: '/assets/img/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/img/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/assets/img/favicons/apple-touch-icon.png',
    shortcut: '/assets/img/favicons/favicon.ico',
  },
  manifest: '/assets/img/favicons/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // ponytail: dir is fixed to ltr. The pug build shipped a second RTL copy of every
    // stylesheet and a head script that disabled one set at runtime; nothing in the app
    // sets phoenixIsRTL. Re-add theme-rtl.min.css + the swap if you ever localise.
    <html lang="en-US" dir="ltr" data-navigation-type="default" data-navbar-horizontal-shape="default">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link href="/vendors/simplebar/simplebar.min.css" rel="stylesheet" />
        <link
          rel="stylesheet"
          href="https://unicons.iconscout.com/release/v4.0.8/css/line.css"
        />
        <link href="/assets/css/theme.min.css" type="text/css" rel="stylesheet" id="style-default" />
        <link href="/assets/css/user.min.css" type="text/css" rel="stylesheet" id="user-style-default" />
        {/* ponytail: every vendor stylesheet any ported page uses, loaded on all of
            them. 9 small files; the alternative is per-page <head> plumbing for the
            three pages that draw a map or a date picker. */}
        <link href="/vendors/leaflet/leaflet.css" rel="stylesheet" />
        <link href="/vendors/leaflet.markercluster/MarkerCluster.css" rel="stylesheet" />
        <link href="/vendors/leaflet.markercluster/MarkerCluster.Default.css" rel="stylesheet" />
        <link href="/vendors/choices/choices.min.css" rel="stylesheet" />
        <link href="/vendors/flatpickr/flatpickr.min.css" rel="stylesheet" />
        <link href="/vendors/dropzone/dropzone.css" rel="stylesheet" />
        <link href="/vendors/glightbox/glightbox.min.css" rel="stylesheet" />
        <link href="/vendors/dhtmlx-gantt/dhtmlxgantt.css" rel="stylesheet" />
        {/* Both must run before first paint: config.js reads the persisted theme and
            simplebar is queried by the vertical navbar during init. */}
        <Script src="/vendors/simplebar/simplebar.min.js" strategy="beforeInteractive" />
        <Script src="/assets/js/config.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  )
}
