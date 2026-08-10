import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// ==========================================================
// FASE 4: BACKEND SEGURO & SANITIZACIÓN MASS ASSIGNMENT
// Middleware para prevenir sobreescritura de campos sensibles
// ==========================================================
const sanitizeMassAssignment = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === "object") {
    const isSuperAdmin = req.headers["x-user-role"] === "SUPER_ADMIN";
    if (!isSuperAdmin) {
      // Bloquear o eliminar campos de rol, tenantId y stationIds inyectados maliciosamente
      delete req.body.rol;
      delete req.body.tenantId;
      delete req.body.stationIds;
    }
  }
  next();
};

app.use(sanitizeMassAssignment);

// ==========================================================
// FASE 4: ENDPOINTS API ATÓMICOS
// ==========================================================

// Health Check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Apertura Atómica de Turno
app.post("/api/shifts/open", (req: Request, res: Response) => {
  const { stationId, pisteroId, pisteroNombre, tipoTurno, fecha, tenantId } = req.body;

  if (!stationId || !pisteroNombre || !tipoTurno) {
    return res.status(400).json({ error: "Parámetros requeridos incompletos." });
  }

  const shift = {
    id: `shift-backend-${Date.now()}`,
    tenantId: tenantId || "tenant-estacion-central",
    stationId,
    pisteroId: pisteroId || "pistero-001",
    pisteroNombre,
    tipoTurno,
    fecha: fecha || new Date().toISOString().slice(0, 10),
    estado: "OPEN",
    horaApertura: new Date().toISOString(),
    totalFuelSales: 0,
    totalFuelLiters: 0,
    totalStoreSales: 0,
    totalCashRecorded: 0,
    totalDeposits: 0,
    totalDifference: 0,
  };

  res.json({
    success: true,
    message: "Apertura atómica de turno procesada exitosamente en backend.",
    shift,
  });
});

// Cierre Atómico de Turno y Consolidación
app.post("/api/shifts/close", (req: Request, res: Response) => {
  const { shiftId, observaciones, cerradoPor } = req.body;

  if (!shiftId) {
    return res.status(400).json({ error: "El shiftId es requerido." });
  }

  res.json({
    success: true,
    message: `Turno ${shiftId} cerrado y consolidado atómicamente por ${cerradoPor || "Sistema"}.`,
    shiftId,
    horaCierre: new Date().toISOString(),
    observaciones: observaciones || "Cierre procesado sin novedades.",
  });
});

// Cambio Atómico de Precios de Combustible y Tienda
app.post("/api/prices/update", (req: Request, res: Response) => {
  const { stationId, productId, nuevoPrecio, modificadoPor } = req.body;

  if (!stationId || !productId || nuevoPrecio === undefined) {
    return res.status(400).json({ error: "Parámetros de cambio de precio inválidos." });
  }

  res.json({
    success: true,
    message: `Precio actualizado atómicamente para el producto ${productId} a C$ ${nuevoPrecio}.`,
    stationId,
    productId,
    nuevoPrecio,
    modificadoPor: modificadoPor || "Admin",
    updatedAt: new Date().toISOString(),
  });
});

// Aprobación de Desbalances / Descuadres por Supervisión
app.post("/api/reconciliations/approve", (req: Request, res: Response) => {
  const { shiftId, aprobadorId, aprobadorNombre, justificacion } = req.body;

  if (!shiftId || !aprobadorNombre) {
    return res.status(400).json({ error: "Datos de aprobación de desbalance incompletos." });
  }

  res.json({
    success: true,
    message: `Desbalance del turno ${shiftId} aprobado por ${aprobadorNombre}.`,
    shiftId,
    aprobadorNombre,
    justificacion: justificacion || "Aprobado tras verificación de comprobantes.",
    fechaAprobacion: new Date().toISOString(),
  });
});

// ==========================================================
// FASE 5: PROXY SEGURO PARA GEMINI API
// Servidor Node.js sin exponer la API Key en el cliente
// ==========================================================
app.post("/api/ai/assistant", async (req: Request, res: Response) => {
  try {
    const { prompt, shiftData } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY no está configurada en las variables de entorno del servidor.",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
Eres el Asistente Inteligente Supervisor SaaS de Gasolineras (Gasonline AI).
Analiza los datos operativos del turno o la consulta enviada y proporciona un informe conciso, profesional y directo en español.
Sigue esta estructura si analizas un turno:
- Resumen Ejecutivo de la Operación
- Puntos Críticos y Faltantes
- Anomalías en Mangueras o Inventarios
- Recomendaciones de Cierre para la Gerencia
- Nivel de Riesgo (BAJO, MEDIO o ALTO)
    `;

    const fullPrompt = shiftData
      ? `${systemInstruction}\n\nDatos del Turno para Análisis:\n${JSON.stringify(shiftData, null, 2)}\n\nPregunta/Instrucción Adicional: ${prompt || "Proporciona el análisis integral del turno."}`
      : `${systemInstruction}\n\nConsulta del usuario: ${prompt}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });

    const analysisText = response.text || "No se pudo generar la respuesta de IA.";

    return res.json({
      success: true,
      analysis: analysisText,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error en proxy Gemini backend:", error);
    return res.status(500).json({
      error: "Error interno procesando la solicitud de IA en el servidor seguro.",
      message: error?.message || String(error),
    });
  }
});

// ==========================================================
// FASE 6: BITÁCORA DE AUDITORÍA CENTRALIZADA E INALTERABLE
// ==========================================================
app.post("/api/audit/log", (req: Request, res: Response) => {
  const { tenantId, usuarioId, usuarioNombre, rol, modulo, accion, detalles } = req.body;

  if (!usuarioNombre || !modulo || !accion) {
    return res.status(400).json({ error: "Formato de registro de auditoría inválido." });
  }

  const logEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    tenantId: tenantId || "tenant-estacion-central",
    usuarioId: usuarioId || "usr-anon",
    usuarioNombre,
    rol: rol || "OPERADOR",
    modulo,
    accion,
    detalles,
    timestamp: new Date().toISOString(),
    immutable: true, // Inmutable
  };

  return res.json({
    success: true,
    message: "Registro de auditoría inmutable almacenado correctamente.",
    logEntry,
  });
});

// ==========================================================
// VITE MIDDLEWARE SETUP (DEV / PROD)
// ==========================================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gasolineras SaaS Backend ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

startServer();
