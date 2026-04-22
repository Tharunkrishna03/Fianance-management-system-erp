export default function Loading() {
  return (
    <div
      style={{
        minHeight: "240px",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: "12px",
          justifyItems: "center",
          color: "#0284c7",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "999px",
            border: "3px solid rgba(2, 132, 199, 0.18)",
            borderTopColor: "#0284c7",
            animation: "dashboard-content-spin 0.9s linear infinite",
          }}
        />
        <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>Loading dashboard...</p>
      </div>
      <style>{`
        @keyframes dashboard-content-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
