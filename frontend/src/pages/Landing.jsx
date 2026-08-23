import { Link } from "react-router-dom";
import Brand from "../components/Brand.jsx";
import { FadeIn } from "../components/PageMotion.jsx";

export default function Landing() {
  return (
    <div className="hero-wrap">
      <div className="page">
        <header className="topbar">
          <Brand size={48} />
          <div className="row">
            <Link className="btn ghost" to="/login">Sign in</Link>
            <Link className="btn gold" to="/register">Create account</Link>
          </div>
        </header>
        <section className="hero">
          <FadeIn>
            <div className="kicker">Farm to mart · no commission agent</div>
            <h1>Empty shelves turn into farmer orders in one pass.</h1>
            <p className="lede">
              A mart scans what is missing, AgriFlow splits the request across farmers who actually have the crop,
              a nearby driver picks up the load, and AgriFlow escrow holds the mart’s money until delivery is confirmed.
            </p>
            <div className="row" style={{ marginTop: 22 }}>
              <Link className="btn" to="/register">Start as a mart</Link>
              <Link className="btn ghost" to="/login">Sign in</Link>
            </div>
          </FadeIn>
          <FadeIn delay={0.08} className="hero-card panel">
            <h3 className="serif" style={{ marginTop: 0 }}>How a day runs</h3>
            <div className="roles">
              <div className="role">
                <div className="icon-dot retailer">M</div>
                <div>
                  <b>Big mart</b>
                  <span>Scan shelves or type what is empty. Load wallet. Escrow locks funds when a farmer accepts.</span>
                </div>
              </div>
              <div className="role">
                <div className="icon-dot farmer">F</div>
                <div>
                  <b>Farmer</b>
                  <span>Keep produce stock updated. Accept only what you can supply. Escrow pays you on delivery.</span>
                </div>
              </div>
              <div className="role">
                <div className="icon-dot driver">T</div>
                <div>
                  <b>Driver</b>
                  <span>Bundle same-area pickups and drop-offs. Update live location until the mart receives it.</span>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>
      </div>
    </div>
  );
}
