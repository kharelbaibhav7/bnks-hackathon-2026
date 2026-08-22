import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="hero-wrap">
      <div className="page">
        <header className="topbar">
          <div className="brand"><div className="mark">A</div> AgriFlow</div>
          <div className="row">
            <Link className="btn ghost" to="/login">Sign in</Link>
            <Link className="btn gold" to="/register">Create account</Link>
          </div>
        </header>
        <section className="hero">
          <div>
            <div className="kicker">Farm to mart · no commission agent</div>
            <h1>Empty shelves turn into farmer orders in one pass.</h1>
            <p className="lede">
              A mart scans what is missing, AgriFlow splits the request across farmers who actually have the crop,
              a nearby driver picks up the load, and payment moves the moment goods change hands.
            </p>
            <div className="row" style={{ marginTop: 22 }}>
              <Link className="btn" to="/register">Start as a mart</Link>
              <Link className="btn ghost" to="/login">Use demo accounts</Link>
            </div>
          </div>
          <div className="hero-card panel">
            <h3 className="serif" style={{ marginTop: 0 }}>How a day runs</h3>
            <div className="roles">
              <div className="role">
                <div className="icon-dot retailer">M</div>
                <div>
                  <b>Big mart</b>
                  <span>Scan shelves or type what is empty. Load wallet. Watch the truck in real time.</span>
                </div>
              </div>
              <div className="role">
                <div className="icon-dot farmer">F</div>
                <div>
                  <b>Farmer</b>
                  <span>Keep produce stock updated. Accept only what you can supply. Get paid on handover.</span>
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
          </div>
        </section>
      </div>
    </div>
  );
}
