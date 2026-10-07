import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import './index.css'
import App from './App.jsx'
import TrackRide from './components/TrackRide.jsx'

// The family tracking page is public (no login) and must not go through Auth0 at all —
// matched on the raw path before anything else renders.
const trackMatch = window.location.pathname.match(/^\/track\/([^/]+)\/?$/);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {trackMatch ? (
      <TrackRide token={trackMatch[1]} />
    ) : (
      <Auth0Provider
        domain={import.meta.env.VITE_AUTH0_DOMAIN}
        clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        }}
        cacheLocation="localstorage"
      >
        <App />
      </Auth0Provider>
    )}
  </StrictMode>,
)
