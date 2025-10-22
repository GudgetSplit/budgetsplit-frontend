// frontend/src/components/Avatar.jsx
export default function Avatar({ name = "", size = 32 }) {
  // pick first letter
  const letter = name?.charAt(0)?.toUpperCase() || "?";

  // color from name (simple hash)
  const colors = ["#06623B", "#2A9D8F", "#E76F51", "#F4A261", "#264653"];
  const color = colors[name?.charCodeAt(0) % colors.length] || "#999";

  return (
    <div
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: size / 2,
      }}
      title={name}
    >
      {letter}
    </div>
  );
}