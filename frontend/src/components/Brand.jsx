export default function Brand({ size = 38, showWord = true, light = false }) {
  return (
    <div className={`brand ${light ? "brand-light" : ""}`}>
      <img src="/logo.png" alt="AgriFlow" className="brand-logo" style={{ width: size, height: size }} />
      {showWord && (
        <span className="brand-word">
          Agri<span>Flow</span>
        </span>
      )}
    </div>
  );
}
