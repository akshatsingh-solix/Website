import { Component } from "react";
import { useLocation } from "react-router-dom";
import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";
import { isChunkError, reloadForNewBuild } from "@/lib/lazyWithRetry";
import { translateText } from "@/i18n/tx";

/**
 * Keeps one broken page from taking the whole app down. Without a boundary,
 * React 19 unmounts everything on a render error, leaving a blank screen
 * until the visitor reloads. With it, the header and navigation keep working
 * and only the page area shows a short message with Try again / Reload.
 *
 * A missing code chunk (the site was redeployed while the tab was open)
 * reloads the page once on its own; see lib/lazyWithRetry.js.
 *
 * The error clears when `resetKey` changes, so navigating away recovers.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey, reloading: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) return { resetKey: props.resetKey, error: null, reloading: false };
    return null;
  }

  componentDidCatch(error, info) {
    if (isChunkError(error) && reloadForNewBuild()) {
      this.setState({ reloading: true });
      return;
    }
    // eslint-disable-next-line no-console
    console.error("[page error]", error, info?.componentStack);
  }

  retry = () => this.setState({ error: null, reloading: false });

  render() {
    const { error, reloading } = this.state;
    if (!error) return this.props.children;
    if (reloading) return <div className={this.props.minHeight || "min-h-[50vh]"} aria-busy="true" />;
    return <PageError chunk={isChunkError(error)} onRetry={this.retry} minHeight={this.props.minHeight} />;
  }
}

/** ErrorBoundary that resets whenever the route changes. */
export const RouteErrorBoundary = ({ children, minHeight }) => {
  const { pathname } = useLocation();
  return <ErrorBoundary resetKey={pathname} minHeight={minHeight}>{children}</ErrorBoundary>;
};

// Plain translateText rather than useTx(): it falls back to the English text
// and needs no provider. Admin pages stay English either way.
const PageError = ({ chunk, onRetry, minHeight = "min-h-[50vh]" }) => (
  <div className={`grid place-items-center px-4 py-16 ${minHeight}`} role="alert" data-testid="page-error">
    <div className="w-full max-w-md rounded-2xl border border-line/10 bg-card/80 p-6 text-center text-foreground shadow-sm">
      <span className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <h2 className="font-display text-xl font-medium tracking-tight">
        {chunk ? translateText("A newer version of this page is available") : translateText("This section didn't load")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {chunk
          ? translateText("Reload to get the latest version. Anything you've saved is safe.")
          : translateText("Something went wrong showing this part of the page. Try again, or reload if it keeps happening.")}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {!chunk && (
          <button type="button" onClick={onRetry} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line/15 px-4 text-sm transition-colors hover:border-line/40 hover:bg-line/5" data-testid="page-error-retry">
            <RotateCcw className="h-4 w-4" /> {translateText("Try again")}
          </button>
        )}
        <button type="button" onClick={() => window.location.reload()} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90" data-testid="page-error-reload">
          <RefreshCw className="h-4 w-4" /> {translateText("Reload page")}
        </button>
      </div>
    </div>
  </div>
);
