"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

type Jugador = {
  id: string;
  user_id: string;
  apellidos: string;
  nombre: string;
  posicion: string;
  pos_especifica: string;
  equipo_actual: string;
  ano_nac: string;
  edad: string;
  pais: string;
  pasaporte: string;
  pie: string;
  altura: string;
  valor_tm: string;
  contrato_hasta: string;
  scoring_scout: string;
  scoring_index: string;
  categoria: string;
  perfil_tactico: string;
  nota_scout: string;
  potencial: string;
  nota_fisica: string;
  nota_tactica: string;
  descartado: boolean;
  motivo_descarte: string;
  created_at: string;
};

const POS_COLORES: Record<string, string> = {
  Portero: "#f59e0b",
  Defensa: "#3b82f6",
  Centrocampista: "#10b981",
  Delantero: "#ef4444",
  Lateral: "#8b5cf6",
};

function getPosColor(pos: string) {
  for (const key of Object.keys(POS_COLORES)) {
    if (pos?.toLowerCase().includes(key.toLowerCase())) return POS_COLORES[key];
  }
  return "#6b7280";
}

export default function Jugadores() {
  const { user, perfil } = useAuth();
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroPosicion, setFiltroPosicion] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [pestana, setPestana] = useState<"activos" | "descartados">("activos");

  async function cargar() {
    setLoading(true);

    // Admin y director deportivo ven todos los jugadores
    const esAdmin =
      perfil?.rol === "admin" || perfil?.rol === "director";

    let query = supabase
      .from("jugadores")
      .select("*")
      .order("created_at", { ascending: false });

    // Si NO es admin ni director, solo ve sus propios jugadores
    if (!esAdmin) {
      query = query.eq("user_id", user!.id);
    }

    const { data, error } = await query;
    if (!error && data) setJugadores(data as Jugador[]);
    setLoading(false);
  }

  // Espera a que carguen tanto user como perfil antes de consultar
  useEffect(() => {
    if (user && perfil !== undefined) cargar();
  }, [user, perfil]);

  const activos = jugadores.filter((j) => !j.descartado);
  const descartados = jugadores.filter((j) => j.descartado);
  const posiciones = [
    ...new Set(activos.map((j) => j.posicion).filter(Boolean)),
  ];
  const categorias = [
    ...new Set(activos.map((j) => j.categoria).filter(Boolean)),
  ];

  const filtrados = activos.filter((j) => {
    const texto = busqueda.toLowerCase();
    const coincideTexto =
      !busqueda ||
      `${j.apellidos} ${j.nombre}`.toLowerCase().includes(texto) ||
      (j.equipo_actual || "").toLowerCase().includes(texto) ||
      (j.pais || "").toLowerCase().includes(texto);
    return (
      coincideTexto &&
      (!filtroPosicion || j.posicion === filtroPosicion) &&
      (!filtroCategoria || j.categoria === filtroCategoria)
    );
  });

  const descartadosFiltrados = descartados.filter((d) => {
    if (!busqueda) return true;
    const texto = busqueda.toLowerCase();
    return (
      `${d.apellidos} ${d.nombre}`.toLowerCase().includes(texto) ||
      (d.equipo_actual || "").toLowerCase().includes(texto)
    );
  });

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f1117",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <div>Debes iniciar sesión para ver esta página</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f1117",
        color: "#e5e7eb",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* CABECERA */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#fff" }}
            >
              👤 Base de jugadores
            </h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
              {activos.length} activos · {descartados.length} descartados
              {perfil && (
                <span>
                  {" "}
                  · {perfil.nombre} ({perfil.rol})
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => (window.location.href = "/jugadores/nuevo")}
            style={{
              background: "#3b82f6",
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Añadir jugador
          </button>
        </div>

        {/* PESTAÑAS */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 24,
            background: "#1a1f2e",
            borderRadius: 12,
            padding: 4,
            width: "fit-content",
            border: "1px solid #1f2937",
          }}
        >
          <button
            onClick={() => setPestana("activos")}
            style={{
              background: pestana === "activos" ? "#3b82f6" : "transparent",
              border: "none",
              borderRadius: 9,
              padding: "8px 20px",
              color: pestana === "activos" ? "#fff" : "#6b7280",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            👤 Activos ({activos.length})
          </button>
          <button
            onClick={() => setPestana("descartados")}
            style={{
              background:
                pestana === "descartados" ? "#ef4444" : "transparent",
              border: "none",
              borderRadius: 9,
              padding: "8px 20px",
              color: pestana === "descartados" ? "#fff" : "#6b7280",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ❌ Descartados ({descartados.length})
          </button>
        </div>

        {/* BUSCADOR Y FILTROS */}
        <div
          style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}
        >
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="🔍 Buscar por nombre, club, país..."
            style={{
              flex: 1,
              minWidth: 260,
              background: "#1a1f2e",
              border: "1px solid #1f2937",
              borderRadius: 10,
              padding: "10px 16px",
              color: "#fff",
              fontSize: 14,
              outline: "none",
            }}
          />
          {pestana === "activos" && (
            <>
              <select
                value={filtroPosicion}
                onChange={(e) => setFiltroPosicion(e.target.value)}
                style={{
                  background: "#1a1f2e",
                  border: "1px solid #1f2937",
                  borderRadius: 10,
                  padding: "10px 16px",
                  color: filtroPosicion ? "#fff" : "#6b7280",
                  fontSize: 14,
                  outline: "none",
                }}
              >
                <option value="">Todas las posiciones</option>
                {posiciones.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                style={{
                  background: "#1a1f2e",
                  border: "1px solid #1f2937",
                  borderRadius: 10,
                  padding: "10px 16px",
                  color: filtroCategoria ? "#fff" : "#6b7280",
                  fontSize: 14,
                  outline: "none",
                }}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        {/* TABLA ACTIVOS */}
        {pestana === "activos" &&
          (loading ? (
            <div
              style={{ textAlign: "center", padding: 60, color: "#6b7280" }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
              Cargando jugadores...
            </div>
          ) : filtrados.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: 60, color: "#6b7280" }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Sin resultados</div>
            </div>
          ) : (
            <div
              style={{
                background: "#1a1f2e",
                border: "1px solid #1f2937",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      background: "#111827",
                      borderBottom: "1px solid #1f2937",
                    }}
                  >
                    {[
                      "Jugador",
                      "Posición",
                      "Club",
                      "Edad",
                      "País",
                      "Pie",
                      "Scoring",
                      "Categoría",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((j, i) => (
                    <tr
                      key={j.id || i}
                      onClick={() =>
                        (window.location.href = `/jugadores/${j.id}`)
                      }
                      style={{
                        borderBottom: "1px solid #1f2937",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLTableRowElement).style.background =
                          "#111827")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLTableRowElement).style.background =
                          "transparent")
                      }
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, #3b82f6, #2563eb)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#fff",
                            }}
                          >
                            {j.apellidos?.[0] || "?"}
                          </div>
                          <div>
                            <div
                              style={{
                                fontWeight: 700,
                                color: "#fff",
                                fontSize: 14,
                              }}
                            >
                              {j.apellidos}
                            </div>
                            <div style={{ color: "#9ca3af", fontSize: 12 }}>
                              {j.nombre}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            background: getPosColor(j.posicion) + "20",
                            color: getPosColor(j.posicion),
                            border: `1px solid ${getPosColor(j.posicion)}40`,
                            borderRadius: 6,
                            padding: "3px 10px",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {j.posicion || "—"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 14,
                          color: "#d1d5db",
                        }}
                      >
                        {j.equipo_actual || "—"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 14,
                          color: "#d1d5db",
                        }}
                      >
                        {j.edad || "—"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 14,
                          color: "#d1d5db",
                        }}
                      >
                        {j.pais || "—"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 14,
                          color: "#d1d5db",
                        }}
                      >
                        {j.pie || "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {j.scoring_index ? (
                          <span
                            style={{
                              background:
                                parseFloat(j.scoring_index) >= 8
                                  ? "#10b98120"
                                  : parseFloat(j.scoring_index) >= 6
                                  ? "#f59e0b20"
                                  : "#ef444420",
                              color:
                                parseFloat(j.scoring_index) >= 8
                                  ? "#10b981"
                                  : parseFloat(j.scoring_index) >= 6
                                  ? "#f59e0b"
                                  : "#ef4444",
                              borderRadius: 6,
                              padding: "3px 10px",
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            {j.scoring_index}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "#9ca3af",
                        }}
                      >
                        {j.categoria || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {/* TABLA DESCARTADOS */}
        {pestana === "descartados" &&
          (descartadosFiltrados.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: 60, color: "#6b7280" }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                No hay jugadores descartados
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {descartadosFiltrados.map((d, i) => (
                <div
                  key={i}
                  onClick={() =>
                    (window.location.href = `/jugadores/${d.id}`)
                  }
                  style={{
                    background: "#1a1f2e",
                    border: "1px solid #ef444420",
                    borderRadius: 14,
                    padding: "18px 24px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "#ef444415",
                      border: "2px solid #ef444430",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      fontWeight: 900,
                      color: "#ef4444",
                    }}
                  >
                    {d.apellidos?.[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}
                    >
                      {d.apellidos}, {d.nombre}
                    </div>
                    <div
                      style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}
                    >
                      🏟️ {d.equipo_actual || "—"} · 📍 {d.posicion || "—"}
                    </div>
                    {d.motivo_descarte && (
                      <div
                        style={{
                          color: "#9ca3af",
                          fontSize: 13,
                          marginTop: 6,
                        }}
                      >
                        📝 {d.motivo_descarte}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      background: "#ef444415",
                      color: "#ef4444",
                      border: "1px solid #ef444430",
                      borderRadius: 8,
                      padding: "6px 14px",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    ❌ Descartado
                  </span>
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}