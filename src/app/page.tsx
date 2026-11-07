import { AuthForward } from "./auth-forward";
import { HomeStatus } from "./home-status";

// Placeholder home: Phase D ports the dashboard and every view from the artifact.
export default function Home() {
  return (
    <main className="wrap" style={{ paddingTop: 48 }}>
      <AuthForward />
      <section className="panel"><div className="panel-h"><h2>Cairn</h2></div>
        <div className="panel-b">
          <p className="muted">Cairn è online. Le schede (Dashboard, Entrate, Spese, Fatture, F24…) arrivano nella Fase D.</p>
          <HomeStatus />
        </div>
      </section>
    </main>
  );
}
