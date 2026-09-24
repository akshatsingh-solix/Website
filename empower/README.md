# SOLIXEmpower website

The SOLIXEmpower event site. It is its own website (Vite + React + Tailwind),
built in the Solix "Luminous Data" brand language and backed by the same API
as the corporate site (`/api/events/*` in the backend).

```
npm ci
npm run dev        # http://localhost:5173/Website/empower/
npm run build      # -> dist/
```

## Configuration (build-time env)

| Variable             | Default                                   | Purpose                                              |
| -------------------- | ----------------------------------------- | ---------------------------------------------------- |
| `VITE_BASE`          | `/Website/empower/`                       | Where the site is served. Use `/` on its own domain. |
| `VITE_API_URL`       | `https://solix-backend-mf5w.onrender.com` | Backend base URL.                                    |
| `VITE_MAIN_SITE_URL` | `/Website/`                               | Link back to the corporate site.                     |

The GitHub Pages workflow builds this site and publishes it under
`/Website/empower/` next to the corporate site. Deep links work through the
corporate site's `404.html`.

## Content and operations

- Event copy, links, history and FAQ: `src/data/event.js`
- Agenda and speakers: `src/data/program.js`
- Passes, prices, payment method (free, Eventbrite, Stripe Payment Link,
  invoice), capacity, promo codes and whether registration is open are set in
  the corporate admin under **Admin > Events**, with no rebuild needed.
- Registrations appear in Admin > Events (check-in, status, CSV/Excel export),
  in the Form inbox, and as scored leads.

To run a future edition, copy the data files, point `EVENT.slug` at a new
backend event, and redeploy.
