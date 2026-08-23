export default function Brand({ size = 42, showWord = true, light = false }) {
  return (
    <div className={`brand ${light ? "brand-light" : ""}`}>
      <img
        src="/logo.png?v=5"
        alt="AgriFlow"
        className="brand-logo"
        style={{ height: size, width: "auto" }}
      />
      {showWord && (
        <span className="brand-word">
          Agri<span>Flow</span>
        </span>
      )}
    </div>
  );
}
